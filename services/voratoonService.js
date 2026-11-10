const axios = require('axios');
const jpeg = require('jpeg-js');
const komikuService = require('./komikuService');

const VORA_ORIGIN = 'https://v10.voratoon.com';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
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

  try {
    const r = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://voratoon.co/'
      },
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
  } catch {
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

/**
 * Extracts Next.js RSC initialData from Voratoon HTML pages
 */
function extractInitialData(html) {
  if (!html || typeof html !== 'string') return null;
  const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
  for (const m of matches) {
    const raw = m[1];
    if (raw.includes('initialData')) {
      try {
        const unescaped = JSON.parse(`"${raw}"`);
        const idx = unescaped.indexOf('"initialData":');
        if (idx !== -1) {
          let depth = 0;
          let start = unescaped.indexOf('{', idx);
          let end = -1;
          for (let i = start; i < unescaped.length; i++) {
            if (unescaped[i] === '{') depth++;
            else if (unescaped[i] === '}') {
              depth--;
              if (depth === 0) {
                end = i + 1;
                break;
              }
            }
          }
          if (end !== -1) {
            const jsonStr = unescaped.substring(start, end);
            return JSON.parse(jsonStr);
          }
        }
      } catch (err) {}
    }
  }
  return null;
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

// In-memory global catalog cache to store known series across pages
const catalogMap = new Map();
function storeInCatalog(items) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    if (it && (it.slug || it.data?.slug)) {
      const normalized = normalizeSeriesItem(it);
      if (normalized && normalized.slug) {
        catalogMap.set(normalized.slug, normalized);
      }
    }
  }
}

/**
 * 1. GET HOME
 * Fetches popular today, popular week, and latest series from Voratoon
 */
async function getHome() {
  const cacheKey = 'vora_home';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${VORA_ORIGIN}/`, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });
    const initial = extractInitialData(res.data);
    if (!initial) throw new Error('Failed to parse Voratoon home data');

    storeInCatalog(initial.popular);
    storeInCatalog(initial.updates);
    storeInCatalog(initial.banner);
    storeInCatalog(initial.newSeries);
    storeInCatalog(initial.completed);

    const rankHarian = (initial.popular || []).map((item, idx) => ({
      rank: idx + 1,
      ...normalizeSeriesItem(item)
    }));

    const rankMingguan = (initial.banner || []).map((item, idx) => ({
      rank: idx + 1,
      ...normalizeSeriesItem(item)
    }));

    const terbaru = (initial.updates || []).map(normalizeSeriesItem);

    const result = {
      rankHarian,
      rankMingguan,
      terbaru
    };

    setCached(cacheKey, result, 60);
    return result;
  } catch (err) {
    console.warn('[Voratoon Home Fallback to Komiku]', err.message);
    return komikuService.getHome();
  }
}

/**
 * 2. GET MANGA LIST (BROWSE)
 */
async function getMangaList(query = {}) {
  const { page = 1, limit = 24, tipe, status, search, genre } = query;
  const cacheKey = `vora_list_${page}_${limit}_${tipe || ''}_${status || ''}_${search || ''}_${genre || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Ensure catalog has items from browse page
  if (catalogMap.size < 30) {
    try {
      const res = await axios.get(`${VORA_ORIGIN}/browse`, { headers: DEFAULT_HEADERS, timeout: 12000 });
      const initial = extractInitialData(res.data);
      if (initial && initial.series) {
        storeInCatalog(initial.series);
      }
    } catch {}
  }

  let allItems = Array.from(catalogMap.values());

  if (tipe) {
    allItems = allItems.filter((it) => it.type.toLowerCase() === tipe.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    allItems = allItems.filter((it) => it.title.toLowerCase().includes(s) || it.slug.toLowerCase().includes(s));
  }
  if (genre) {
    const g = genre.toLowerCase();
    allItems = allItems.filter((it) => it.genres.some((gen) => gen.toLowerCase().includes(g)));
  }

  if (allItems.length === 0) {
    try {
      return await komikuService.getMangaList(query);
    } catch {}
  }

  const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const pagedItems = allItems.slice(startIndex, startIndex + parseInt(limit, 10));

  if (pagedItems.length === 0) {
    try {
      return await komikuService.getMangaList(query);
    } catch {}
  }

  const result = {
    page: parseInt(page, 10),
    data: pagedItems,
    hasMore: startIndex + parseInt(limit, 10) < allItems.length
  };

  setCached(cacheKey, result, 60);
  return result;
}

/**
 * 3. SEARCH MANGA
 */
async function searchManga(keyword = '') {
  if (!keyword || !keyword.trim()) return [];
  const clean = keyword.trim().toLowerCase();
  const cacheKey = `vora_search_${clean}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = [];
  const seenSlugs = new Set();

  // 1. Search in local catalog
  for (const item of catalogMap.values()) {
    if (
      item.title.toLowerCase().includes(clean) ||
      item.slug.toLowerCase().includes(clean)
    ) {
      if (!seenSlugs.has(item.slug)) {
        seenSlugs.add(item.slug);
        results.push(item);
      }
    }
  }

  // 2. Direct probe if keyword looks like slug
  const probeSlug = clean.replace(/[^a-z0-9]+/g, '-');
  if (!seenSlugs.has(probeSlug) && probeSlug.length > 2) {
    try {
      const detail = await getComicDetail(probeSlug);
      if (detail && !seenSlugs.has(detail.slug)) {
        seenSlugs.add(detail.slug);
        results.push({
          id: detail.slug,
          title: detail.title,
          slug: detail.slug,
          thumbnail: detail.thumbnail,
          type: detail.type,
          info: `${detail.type} • ${detail.rating ? `${detail.rating}/10` : ''}`,
          rating: detail.rating,
          totalChapters: detail.chapters?.length || null,
          latestChapter: detail.latestChapter?.title || '',
          latestChapterSlug: detail.latestChapter?.slug || '',
          description: detail.synopsis || '',
          genres: detail.genres.map((g) => g.name)
        });
      }
    } catch {}
  }

  // 3. Fallback to Komiku if results are few
  if (results.length === 0) {
    try {
      const kRes = await komikuService.searchManga(keyword);
      for (const k of kRes) {
        if (!seenSlugs.has(k.slug)) {
          seenSlugs.add(k.slug);
          results.push(k);
        }
      }
    } catch {}
  }

  setCached(cacheKey, results, 60);
  return results;
}

/**
 * 4. GET COMIC DETAIL
 */
async function getComicDetail(slug) {
  if (!slug) throw new Error('Missing slug');
  const cacheKey = `vora_detail_${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${VORA_ORIGIN}/series/${encodeURIComponent(slug)}`, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });
    const initial = extractInitialData(res.data);
    if (!initial || !initial.series || !initial.series[0]) {
      throw new Error(`Comic not found on Voratoon: ${slug}`);
    }

    const seriesItem = initial.series[0];
    const sData = seriesItem.data || seriesItem;
    const rawChapters = initial.chapters || [];

    storeInCatalog([seriesItem]);

    const chapters = rawChapters.map((ch) => {
      const chData = ch.data || {};
      const index = ch.chapterIndex !== undefined ? ch.chapterIndex : chData.index;
      const chTitle = chData.title ? `Chapter ${index}: ${chData.title}` : `Chapter ${index}`;
      const date = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString('id-ID') : '';

      return {
        title: chTitle,
        index,
        slug: `${slug}@${index}`,
        date
      };
    });

    const genres = (sData.genres || []).map((g) => ({
      name: g.data?.name || g.name || '',
      slug: (g.data?.name || g.name || '').toLowerCase().replace(/\s+/g, '-')
    }));

    const detail = {
      title: sData.title || slug,
      altTitle: sData.nativeTitle || '',
      slug,
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
  } catch (err) {
    // If not found or failed on Voratoon, fallback to Komiku
    console.warn(`[Voratoon Detail Fallback to Komiku: ${slug}]`, err.message);
    return komikuService.getComicDetail(slug);
  }
}

/**
 * 5. GET CHAPTER READER DATA
 * Handles: slug@chapterIndex or seriesSlug/chapterIndex
 */
async function getChapter(param) {
  if (!param) throw new Error('Missing chapter parameter');
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
    const match = param.match(/(.+)-chapter-(\d+(\.\d+)?)$/);
    if (match) {
      seriesSlug = match[1];
      chapterIndex = match[2];
    }
  }

  if (seriesSlug && chapterIndex) {
    try {
      const res = await axios.get(
        `${VORA_ORIGIN}/series/${encodeURIComponent(seriesSlug)}/chapter/${encodeURIComponent(chapterIndex)}`,
        { headers: DEFAULT_HEADERS, timeout: 15000 }
      );
      const initial = extractInitialData(res.data);
      if (initial && initial.chapter) {
        const rawChapterData = initial.chapter.data || {};
        const rawImages = rawChapterData.images || [];

        const cleanImages = await filterWatermarkImages(rawImages);
        const images = cleanImages.map((imgUrl, i) => ({
          index: i + 1,
          url: imgUrl,
          proxiedUrl: `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`
        }));

        const chList = initial.chapters || [];
        const sorted = [...chList].sort((a, b) => {
          const idxA = parseFloat(a.chapterIndex ?? a.data?.index ?? 0);
          const idxB = parseFloat(b.chapterIndex ?? b.data?.index ?? 0);
          return idxA - idxB;
        });

        const currentNum = parseFloat(chapterIndex);
        const currentIndexInSorted = sorted.findIndex((item) => {
          const idx = parseFloat(item.chapterIndex ?? item.data?.index ?? 0);
          return idx === currentNum;
        });

        let prevChapterSlug = '';
        let nextChapterSlug = '';
        if (currentIndexInSorted > 0) {
          const prevItem = sorted[currentIndexInSorted - 1];
          const prevIdx = prevItem.chapterIndex ?? prevItem.data?.index;
          prevChapterSlug = `${seriesSlug}@${prevIdx}`;
        }
        if (currentIndexInSorted >= 0 && currentIndexInSorted < sorted.length - 1) {
          const nextItem = sorted[currentIndexInSorted + 1];
          const nextIdx = nextItem.chapterIndex ?? nextItem.data?.index;
          nextChapterSlug = `${seriesSlug}@${nextIdx}`;
        }

        const sItem = initial.series?.[0];
        const comicTitle = sItem?.data?.title || seriesSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        const result = {
          title: `Chapter ${chapterIndex}`,
          chapterSlug: `${seriesSlug}@${chapterIndex}`,
          comicTitle,
          comicSlug: seriesSlug,
          prevChapterSlug,
          nextChapterSlug,
          totalImages: images.length,
          images
        };

        setCached(cacheKey, result, 300);
        return result;
      } else {
        // If chapter not found at this index, find the closest available chapter from series detail
        const detail = await getComicDetail(seriesSlug);
        if (detail && detail.chapters && detail.chapters.length > 0) {
          const latestAvailable = detail.chapters[0];
          if (latestAvailable && String(latestAvailable.index) !== String(chapterIndex)) {
            return getChapter(`${seriesSlug}@${latestAvailable.index}`);
          }
        }
      }
    } catch (err) {
      try {
        const detail = await getComicDetail(seriesSlug);
        if (detail && detail.chapters && detail.chapters.length > 0) {
          const latestAvailable = detail.chapters[0];
          if (latestAvailable && String(latestAvailable.index) !== String(chapterIndex)) {
            return getChapter(`${seriesSlug}@${latestAvailable.index}`);
          }
        }
      } catch {}
      console.warn(`[Voratoon Chapter Fallback to Komiku: ${param}]`, err.message);
    }
  }

  // Fallback to Komiku
  return komikuService.getChapter(param);
}

/**
 * 6. GET GENRES
 */
async function getGenres() {
  const cacheKey = 'vora_genres';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${VORA_ORIGIN}/browse`, { headers: DEFAULT_HEADERS, timeout: 12000 });
    const initial = extractInitialData(res.data);
    if (initial && initial.genres && initial.genres.length > 0) {
      const genres = initial.genres.map((g) => ({
        id: g.id,
        name: g.data?.name || g.name || '',
        slug: (g.data?.name || g.name || '').toLowerCase().replace(/\s+/g, '-')
      }));
      setCached(cacheKey, genres, 3600);
      return genres;
    }
  } catch {}

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

module.exports = {
  getHome,
  getMangaList,
  searchManga,
  getComicDetail,
  getChapter,
  getGenres
};
