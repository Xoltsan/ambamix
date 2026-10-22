const axios = require('axios');
const jpeg = require('jpeg-js');

const VORA_API = 'https://api.voratoon.com';
const ORIGIN_URL = 'https://v10.voratoon.com';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://v10.voratoon.com/',
  'Origin': 'https://v10.voratoon.com',
  'Accept': 'application/json, text/plain, */*'
};

// Known perceptual dHash (size=16, 256 bits) for Voratoon promotional / credit banners
const KNOWN_WM_HASHES = [
  // 1. Voratoon Marathon Banner ("Baca Marathon Hanya di VoraToon")
  '1101100100010110000110110000100101010111011100110011000100101010101001100101101110010110100111000011000111010111001101011011001001010111000101100001110100010001001101001101000000101110000010010110011010101101011101001110101000011011000110000100111001010110',
  // 2. Voratoon Staff Recruit Banner ("LOOKING FOR STAFF")
  '0000000000000000000000000011001100011001101011010110011001001001000110101001101100000011010100010000000000000000000111011000000001101101100000111000111101010101001101010100001100001010111010100001110010010010001101100000011000100101111000010111001100001001'
];

// In-memory cache for checked watermark URLs
const wmCache = new Map();

function computeDHash(buffer, size = 16) {
  try {
    const raw = jpeg.decode(buffer, { useTArray: true });
    const targetW = size + 1;
    const targetH = size;
    const gray = new Float32Array(targetW * targetH);
    for (let y = 0; y < targetH; y++) {
      const srcY = Math.floor((y * raw.height) / targetH);
      for (let x = 0; x < targetW; x++) {
        const srcX = Math.floor((x * raw.width) / targetW);
        const idx = (srcY * raw.width + srcX) * 4;
        gray[y * targetW + x] = 0.299 * raw.data[idx] + 0.587 * raw.data[idx + 1] + 0.114 * raw.data[idx + 2];
      }
    }
    let bits = '';
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < size; x++) {
        bits += gray[y * targetW + x] < gray[y * targetW + x + 1] ? '1' : '0';
      }
    }
    return bits;
  } catch (err) {
    return null;
  }
}

function hammingDistance(h1, h2) {
  let diff = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) diff++;
  }
  return diff;
}

async function isWatermarkImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (wmCache.has(url)) return wmCache.get(url);

  const lower = url.toLowerCase();
  // 1. Filename keyword checks
  if (/(marathon|rekrut|watermark|credit|iklan|999-rekrut|999\.jpg)/i.test(lower)) {
    wmCache.set(url, true);
    return true;
  }

  // 2. Fetch and test dHash against known Voratoon promotional banners
  try {
    const r = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      responseType: 'arraybuffer',
      timeout: 4000
    });
    if (r.status === 200 && r.data) {
      const hash = computeDHash(Buffer.from(r.data));
      if (hash) {
        for (const ref of KNOWN_WM_HASHES) {
          const dist = hammingDistance(ref, hash);
          const similarity = (1 - dist / 256) * 100;
          if (similarity >= 75) {
            wmCache.set(url, true);
            return true;
          }
        }
      }
    }
  } catch (err) {
    // If request fails or times out, do not remove to prevent false positives
  }

  wmCache.set(url, false);
  return false;
}

async function filterWatermarkImages(rawImages = []) {
  if (!Array.isArray(rawImages) || rawImages.length <= 1) return rawImages;

  // We only examine trailing images (up to 2 last images) where Voratoon appends promo banners
  const filtered = [...rawImages];
  let checks = 0;
  while (filtered.length > 1 && checks < 2) {
    const lastUrl = filtered[filtered.length - 1];
    const isWM = await isWatermarkImageUrl(lastUrl);
    if (isWM) {
      filtered.pop();
      checks++;
    } else {
      break;
    }
  }

  return filtered;
}

// In-memory cache with TTL
const cache = new Map();
function getCached(key) {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data;
  }
  cache.delete(key);
  return null;
}
function setCached(key, data, ttlSeconds = 60) {
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

function normalizeFormat(format = '') {
  const f = (format || '').toLowerCase();
  if (f === 'manhwa') return 'Manhwa';
  if (f === 'manhua') return 'Manhua';
  return 'Manga';
}

function normalizeSeriesItem(item) {
  if (!item) return null;
  const sData = item.data || item;
  const meta = item.dataMetadata || {};

  const title = sData.title || 'Untitled';
  const slug = sData.slug || String(item.id);
  const thumbnail = sData.coverImage || sData.backgroundImage || '';
  const type = normalizeFormat(sData.format);
  const views = meta.totalViews || sData.totalViews || '0';
  const rating = sData.rating ? `${sData.rating}/10` : '';
  const latestCh = sData.totalChapters ? `Chapter ${sData.totalChapters}` : '';

  return {
    id: item.id,
    title,
    slug,
    thumbnail,
    type,
    info: `${type} • ${rating || `${views} views`}`,
    rating: sData.rating || null,
    totalChapters: sData.totalChapters || null,
    latestChapter: latestCh,
    latestChapterSlug: `${slug}@${sData.totalChapters || '1'}`,
    description: sData.synopsis || '',
    genres: (sData.genres || []).map((g) => g.data?.name || g.name || '').filter(Boolean)
  };
}

/**
 * 1. GET HOME
 * Fetches popular today, popular week, and latest series from Voratoon
 */
async function getHome() {
  const cacheKey = 'vora_home';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [popTodayRes, popWeekRes, latestRes] = await Promise.all([
    axios.get(`${VORA_API}/popular/today`, { headers: DEFAULT_HEADERS, timeout: 12000 }).catch(() => ({ data: { data: [] } })),
    axios.get(`${VORA_API}/popular/week`, { headers: DEFAULT_HEADERS, timeout: 12000 }).catch(() => ({ data: { data: [] } })),
    axios.get(`${VORA_API}/series?page=1&limit=24`, { headers: DEFAULT_HEADERS, timeout: 12000 }).catch(() => ({ data: { data: [] } }))
  ]);

  const rankHarian = (popTodayRes.data?.data || []).map((item, idx) => {
    const normalized = normalizeSeriesItem(item);
    return {
      rank: idx + 1,
      ...normalized
    };
  });

  const rankMingguan = (popWeekRes.data?.data || []).map((item, idx) => {
    const normalized = normalizeSeriesItem(item);
    return {
      rank: idx + 1,
      ...normalized
    };
  });

  const terbaru = (latestRes.data?.data || []).map((item) => normalizeSeriesItem(item));

  const result = {
    rankHarian,
    rankMingguan,
    terbaru
  };

  setCached(cacheKey, result, 60);
  return result;
}

/**
 * 2. GET MANGA LIST (BROWSE)
 */
async function getMangaList(query = {}) {
  const { page = 1, limit = 24, tipe, status, search, genre } = query;
  const cacheKey = `vora_list_${page}_${limit}_${tipe || ''}_${status || ''}_${search || ''}_${genre || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (tipe) params.append('format', tipe.toLowerCase());
  if (status) {
    if (status.toLowerCase().includes('end') || status.toLowerCase().includes('tamat')) {
      params.append('status', 'completed');
    } else {
      params.append('status', 'ongoing');
    }
  }
  if (search) params.append('title', search);

  const res = await axios.get(`${VORA_API}/series?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    timeout: 12000
  });

  const rawList = res.data?.data || [];
  const items = rawList.map((item) => normalizeSeriesItem(item));

  const result = {
    page: parseInt(page, 10),
    data: items,
    hasMore: items.length >= parseInt(limit, 10)
  };

  setCached(cacheKey, result, 60);
  return result;
}

/**
 * 3. SEARCH MANGA
 */
async function searchManga(keyword = '') {
  if (!keyword || !keyword.trim()) return [];

  let clean = keyword.trim();
  let extractedSlug = '';

  // If user pasted a URL e.g. https://v10.voratoon.com/series/kaoru-hana-wa-rin-to-saku
  const urlMatch = clean.match(/\/series\/([^/?#]+)/);
  if (urlMatch) {
    extractedSlug = urlMatch[1];
    clean = extractedSlug.replace(/-/g, ' ');
  } else if (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(clean)) {
    extractedSlug = clean.toLowerCase();
  }

  const cacheKey = `vora_search_${clean.toLowerCase()}_${extractedSlug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const promises = [
    axios.get(`${VORA_API}/series?title=${encodeURIComponent(clean)}&limit=30`, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    }).catch(() => ({ data: { data: [] } }))
  ];

  if (extractedSlug) {
    promises.push(
      axios.get(`${VORA_API}/series?slug=${encodeURIComponent(extractedSlug)}`, {
        headers: DEFAULT_HEADERS,
        timeout: 12000
      }).catch(() => ({ data: { data: [] } }))
    );
  }

  const responses = await Promise.all(promises);
  const combined = [];
  const seenIds = new Set();

  for (const r of responses) {
    const list = r.data?.data || [];
    for (const item of list) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        combined.push(normalizeSeriesItem(item));
      }
    }
  }

  // Prioritize exact or prefix matches
  combined.sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();
    const target = clean.toLowerCase();
    if (aTitle === target) return -1;
    if (bTitle === target) return 1;
    if (aTitle.startsWith(target)) return -1;
    if (bTitle.startsWith(target)) return 1;
    return 0;
  });

  setCached(cacheKey, combined, 60);
  return combined;
}

/**
 * 4. GET COMIC DETAIL
 */
async function getComicDetail(slug) {
  if (!slug) throw new Error('Comic slug is required');
  const cacheKey = `vora_detail_${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Fetch series metadata
  let seriesItem = null;
  const searchRes = await axios.get(`${VORA_API}/series?slug=${encodeURIComponent(slug)}`, {
    headers: DEFAULT_HEADERS,
    timeout: 12000
  });

  if (searchRes.data?.data?.length > 0) {
    seriesItem = searchRes.data.data[0];
  } else {
    // Fallback: search by title / slug
    const fallbackRes = await axios.get(`${VORA_API}/series?search=${encodeURIComponent(slug)}&limit=1`, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });
    seriesItem = fallbackRes.data?.data?.[0];
  }

  if (!seriesItem) {
    throw new Error(`Comic not found: ${slug}`);
  }

  const sData = seriesItem.data;
  const seriesId = seriesItem.id;
  const realSlug = sData.slug || slug;

  // 2. Fetch chapters list
  const chaptersRes = await axios.get(`${VORA_API}/series/${realSlug}/chapters`, {
    headers: DEFAULT_HEADERS,
    timeout: 12000
  }).catch(async () => {
    // Fallback using seriesId
    return axios.get(`${VORA_API}/series/${seriesId}/chapters`, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });
  });

  const rawChapters = chaptersRes.data?.data || [];
  
  // Format chapters
  const chapters = rawChapters.map((ch) => {
    const chData = ch.data || {};
    const index = chData.index !== undefined ? chData.index : ch.chapterIndex;
    const chTitle = chData.title ? `Chapter ${index}: ${chData.title}` : `Chapter ${index}`;
    const date = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString('id-ID') : '';

    return {
      title: chTitle,
      index,
      slug: `${realSlug}@${index}`,
      date
    };
  });

  const genres = (sData.genres || []).map((g) => ({
    name: g.data?.name || g.name || '',
    slug: (g.data?.name || g.name || '').toLowerCase().replace(/\s+/g, '-')
  }));

  const detail = {
    title: sData.title || realSlug,
    altTitle: sData.nativeTitle || '',
    slug: realSlug,
    thumbnail: sData.coverImage || sData.backgroundImage || '',
    backgroundImage: sData.backgroundImage || sData.coverImage || '',
    synopsis: sData.synopsis || '',
    type: normalizeFormat(sData.format),
    status: sData.status === 'completed' ? 'Tamat' : 'Ongoing',
    author: sData.author || 'Unknown',
    rating: sData.rating || 8.0,
    tema: sData.animeAdaptation ? 'Adaptasi Anime' : '',
    genres,
    firstChapter: chapters.length > 0 ? {
      title: chapters[chapters.length - 1].title,
      slug: chapters[chapters.length - 1].slug
    } : null,
    latestChapter: chapters.length > 0 ? {
      title: chapters[0].title,
      slug: chapters[0].slug
    } : null,
    chapters
  };

  setCached(cacheKey, detail, 120);
  return detail;
}

/**
 * 5. GET CHAPTER READER DATA
 * Handles: slug@chapterIndex or seriesSlug/chapterIndex
 */
async function getChapter(param) {
  if (!param) throw new Error('Chapter parameter is required');
  const cacheKey = `vora_chapter_${param}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let seriesSlug = '';
  let chapterIndex = '';

  if (param.includes('@')) {
    const parts = param.split('@');
    seriesSlug = parts[0];
    chapterIndex = parts[1];
  } else if (param.includes('/')) {
    const parts = param.split('/');
    seriesSlug = parts[0];
    chapterIndex = parts[1];
  } else {
    // If slug is e.g. "some-manga-chapter-10"
    const match = param.match(/(.+)-chapter-(\d+(\.\d+)?)$/);
    if (match) {
      seriesSlug = match[1];
      chapterIndex = match[2];
    } else {
      seriesSlug = param;
      chapterIndex = '1';
    }
  }

  // 1. Fetch chapter reader data
  const url = `${VORA_API}/series/${encodeURIComponent(seriesSlug)}/chapters/${encodeURIComponent(chapterIndex)}`;
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 15000 });
  const rawChapterData = res.data?.data?.data || {};

  const rawImages = rawChapterData.images || [];
  // Filter out Voratoon watermark / credit promotional banners
  const cleanImages = await filterWatermarkImages(rawImages);
  const images = cleanImages.map((imgUrl, i) => ({
    index: i + 1,
    url: imgUrl,
    proxiedUrl: `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`
  }));

  // 2. Fetch all chapters of series to calculate previous and next chapters
  let prevChapterSlug = '';
  let nextChapterSlug = '';
  let comicTitle = seriesSlug;

  try {
    const chListRes = await axios.get(`${VORA_API}/series/${encodeURIComponent(seriesSlug)}/chapters`, {
      headers: DEFAULT_HEADERS,
      timeout: 10000
    });
    const chList = chListRes.data?.data || [];
    
    // Sort ascending by index to determine prev and next
    const sorted = [...chList].sort((a, b) => {
      const idxA = parseFloat(a.data?.index ?? a.chapterIndex ?? 0);
      const idxB = parseFloat(b.data?.index ?? b.chapterIndex ?? 0);
      return idxA - idxB;
    });

    const currentNum = parseFloat(chapterIndex);
    const currentIndexInSorted = sorted.findIndex((item) => {
      const idx = parseFloat(item.data?.index ?? item.chapterIndex ?? 0);
      return idx === currentNum;
    });

    if (currentIndexInSorted > 0) {
      const prevItem = sorted[currentIndexInSorted - 1];
      const prevIdx = prevItem.data?.index ?? prevItem.chapterIndex;
      prevChapterSlug = `${seriesSlug}@${prevIdx}`;
    }

    if (currentIndexInSorted >= 0 && currentIndexInSorted < sorted.length - 1) {
      const nextItem = sorted[currentIndexInSorted + 1];
      const nextIdx = nextItem.data?.index ?? nextItem.chapterIndex;
      nextChapterSlug = `${seriesSlug}@${nextIdx}`;
    }
  } catch {
    // Non-fatal if chapter list fails
  }

  const result = {
    title: `Chapter ${chapterIndex}`,
    chapterSlug: `${seriesSlug}@${chapterIndex}`,
    comicTitle: comicTitle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    comicSlug: seriesSlug,
    prevChapterSlug,
    nextChapterSlug,
    totalImages: images.length,
    images
  };

  setCached(cacheKey, result, 300);
  return result;
}

/**
 * 6. GET GENRES
 */
async function getGenres() {
  const cacheKey = 'vora_genres';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${VORA_API}/genres`, { headers: DEFAULT_HEADERS, timeout: 10000 });
    const rawList = res.data?.data || [];
    const genres = rawList.map((g) => ({
      id: g.id,
      name: g.data?.name || g.name || '',
      slug: (g.data?.name || g.name || '').toLowerCase().replace(/\s+/g, '-')
    }));
    setCached(cacheKey, genres, 3600);
    return genres;
  } catch {
    return [
      { slug: 'action', name: 'Action' },
      { slug: 'adventure', name: 'Adventure' },
      { slug: 'comedy', name: 'Comedy' },
      { slug: 'drama', name: 'Drama' },
      { slug: 'fantasy', name: 'Fantasy' },
      { slug: 'martial-arts', name: 'Martial Arts' },
      { slug: 'romance', name: 'Romance' },
      { slug: 'shounen', name: 'Shounen' },
      { slug: 'webtoons', name: 'Webtoons' },
      { slug: 'seinen', name: 'Seinen' },
      { slug: 'isekai', name: 'Isekai' }
    ];
  }
}

module.exports = {
  getHome,
  getMangaList,
  searchManga,
  getComicDetail,
  getChapter,
  getGenres
};
