const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://komiku.org';
const API_BASE_URL = 'https://api.komiku.org';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://komiku.org/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

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

// Clean comic slug from href e.g. /manga/ao-ashi/ -> ao-ashi
function extractSlug(url = '') {
  if (!url) return '';
  const match = url.match(/\/manga\/([^/?#]+)/);
  if (match) return match[1];
  return url.replace(/^\//, '').replace(/\/$/, '');
}

// Clean chapter slug from href e.g. /ao-ashi-chapter-410/ -> ao-ashi-chapter-410
function extractChapterSlug(url = '') {
  if (!url) return '';
  const clean = url.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '');
  return clean;
}

/**
 * 1. GET HOME
 * Fetch home page: rankings (harian & mingguan), terbaru updates, and trending
 */
async function getHome() {
  const cacheKey = 'home_data';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await axios.get(BASE_URL, { headers: DEFAULT_HEADERS, timeout: 12000 });
  const $ = cheerio.load(res.data);

  // Parse Ranking Harian
  const rankHarian = [];
  $('#rank-harian article.ls4').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.ls4v a').attr('href') || '';
    const slug = extractSlug(link);
    const thumbnail = $el.find('.ls4v img').attr('data-src') || $el.find('.ls4v img').attr('src') || '';
    const rank = $el.find('.rank-num').text().trim();
    const title = $el.find('.ls4j h4 a').text().trim();
    const info = $el.find('.ls4j .ls4s').text().trim(); // Drama · 22,017 views
    const latestChapter = $el.find('.ls4j a.ls24').text().trim();
    const latestChapterLink = $el.find('.ls4j a.ls24').attr('href') || '';

    rankHarian.push({
      rank: parseInt(rank, 10) || rankHarian.length + 1,
      title,
      slug,
      thumbnail,
      info,
      latestChapter,
      latestChapterSlug: extractChapterSlug(latestChapterLink)
    });
  });

  // Parse Ranking Mingguan
  const rankMingguan = [];
  $('#rank-mingguan article.ls4').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.ls4v a').attr('href') || '';
    const slug = extractSlug(link);
    const thumbnail = $el.find('.ls4v img').attr('data-src') || $el.find('.ls4v img').attr('src') || '';
    const rank = $el.find('.rank-num').text().trim();
    const title = $el.find('.ls4j h4 a').text().trim();
    const info = $el.find('.ls4j .ls4s').text().trim();
    const latestChapter = $el.find('.ls4j a.ls24').text().trim();
    const latestChapterLink = $el.find('.ls4j a.ls24').attr('href') || '';

    rankMingguan.push({
      rank: parseInt(rank, 10) || rankMingguan.length + 1,
      title,
      slug,
      thumbnail,
      info,
      latestChapter,
      latestChapterSlug: extractChapterSlug(latestChapterLink)
    });
  });

  // Parse Terbaru (Latest updates)
  const terbaru = [];
  $('#Terbaru article.ls2').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.ls2v a').attr('href') || '';
    const slug = extractSlug(link);
    const thumbnail = $el.find('.ls2v img').attr('data-src') || $el.find('.ls2v img').attr('src') || '';
    const flagSrc = $el.find('.ls2v img.flag').attr('src') || '';
    let type = 'Manga';
    if (flagSrc.includes('kr')) type = 'Manhwa';
    else if (flagSrc.includes('cn')) type = 'Manhua';

    const title = $el.find('.ls2j h3 a').text().trim();
    const info = $el.find('.ls2j .ls2t').text().trim(); // e.g. "Romantis · 17 menit lalu"
    const chapter = $el.find('.ls2j a.ls2l').text().trim();
    const chapterLink = $el.find('.ls2j a.ls2l').attr('href') || '';

    terbaru.push({
      title,
      slug,
      thumbnail,
      type,
      info,
      chapter,
      chapterSlug: extractChapterSlug(chapterLink)
    });
  });

  const data = {
    rankHarian,
    rankMingguan,
    terbaru
  };

  setCached(cacheKey, data, 60);
  return data;
}

/**
 * 2. GET MANGA LIST (PUSTAKA)
 * Supports query params: tipe, genre, status, orderby, page
 */
async function getMangaList(query = {}) {
  const { page = 1, tipe, genre, status, orderby = 'modified' } = query;
  const cacheKey = `manga_list_${page}_${tipe || ''}_${genre || ''}_${status || ''}_${orderby}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (tipe) params.append('tipe', tipe);
  if (genre) params.append('genre', genre);
  if (status) params.append('status', status);
  if (orderby) params.append('orderby', orderby);
  if (page > 1) params.append('page', page);

  const url = `${API_BASE_URL}/manga/?${params.toString()}`;
  let html = '';
  try {
    const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 12000 });
    html = res.data;
  } catch (err) {
    // Fallback to website pustaka
    const fallbackUrl = `${BASE_URL}/pustaka/${page > 1 ? `page/${page}/` : ''}?${params.toString()}`;
    const fallbackRes = await axios.get(fallbackUrl, { headers: DEFAULT_HEADERS, timeout: 12000 });
    html = fallbackRes.data;
  }

  const $ = cheerio.load(html);
  const items = [];

  $('.bge').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.bgei a').attr('href') || $el.find('.kan a').attr('href') || '';
    const slug = extractSlug(link);
    const thumbnail =
      $el.find('.bgei img').attr('src') ||
      $el.find('.bgei img').attr('data-src') ||
      '';
    const typeInfo = $el.find('.bgei .tpe1_inf').text().trim();
    const type = $el.find('.bgei .tpe1_inf b').text().trim() || 'Manga';
    const genre = typeInfo.replace(type, '').trim();

    const title = $el.find('.kan h3').text().trim();
    const judul2 = $el.find('.kan .judul2').text().trim();
    const desc = $el.find('.kan p').text().trim();

    const firstChapterEl = $el.find('.kan .new1').first().find('a');
    const latestChapterEl = $el.find('.kan .new1').last().find('a');

    items.push({
      title,
      slug,
      thumbnail,
      type,
      genre,
      judul2,
      description: desc,
      firstChapter: firstChapterEl.text().replace('Awal:', '').trim(),
      firstChapterSlug: extractChapterSlug(firstChapterEl.attr('href')),
      latestChapter: latestChapterEl.text().replace('Terbaru:', '').trim(),
      latestChapterSlug: extractChapterSlug(latestChapterEl.attr('href'))
    });
  });

  const result = {
    page: parseInt(page, 10),
    data: items,
    hasMore: items.length >= 10
  };

  setCached(cacheKey, result, 60);
  return result;
}

/**
 * 3. SEARCH MANGA
 */
async function searchManga(keyword = '') {
  if (!keyword || !keyword.trim()) return [];
  const cacheKey = `search_${keyword.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE_URL}/?post_type=manga&s=${encodeURIComponent(keyword.trim())}`;
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 12000 });
  const $ = cheerio.load(res.data);
  const items = [];

  $('.bge').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.bgei a').attr('href') || $el.find('.kan a').attr('href') || '';
    const slug = extractSlug(link);
    const thumbnail =
      $el.find('.bgei img').attr('src') ||
      $el.find('.bgei img').attr('data-src') ||
      '';
    const typeInfo = $el.find('.bgei .tpe1_inf').text().trim();
    const type = $el.find('.bgei .tpe1_inf b').text().trim() || 'Manga';
    const genre = typeInfo.replace(type, '').trim();

    const title = $el.find('.kan h3').text().trim();
    const desc = $el.find('.kan p').text().trim();

    const firstChapterEl = $el.find('.kan .new1').first().find('a');
    const latestChapterEl = $el.find('.kan .new1').last().find('a');

    items.push({
      title,
      slug,
      thumbnail,
      type,
      genre,
      description: desc,
      firstChapter: firstChapterEl.text().replace('Awal:', '').trim(),
      firstChapterSlug: extractChapterSlug(firstChapterEl.attr('href')),
      latestChapter: latestChapterEl.text().replace('Terbaru:', '').trim(),
      latestChapterSlug: extractChapterSlug(latestChapterEl.attr('href'))
    });
  });

  setCached(cacheKey, items, 60);
  return items;
}

/**
 * 4. GET COMIC DETAIL
 * Fetches https://komiku.org/manga/{slug}/
 */
async function getComicDetail(slug) {
  if (!slug) throw new Error('Comic slug is required');
  const cacheKey = `detail_${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/manga/${slug}/`;
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 12000 });
  const $ = cheerio.load(res.data);

  const title =
    $('h1 span[itemprop="name"]').text().trim() ||
    $('#Judul header h1').text().replace('Komik', '').trim();
  const altTitle = $('.j2').text().trim();
  const thumbnail =
    $('#Informasi .ims img').attr('src') ||
    $('#Informasi .ims img').attr('data-src') ||
    '';
  const synopsis = $('p.desc').text().trim();

  // Parse info table
  const info = {};
  $('table.inftable tr').each((_, el) => {
    const key = $(el).find('td').first().text().replace(':', '').trim();
    const val = $(el).find('td').last().text().trim();
    if (key) info[key] = val;
  });

  // Parse genres
  const genres = [];
  $('table.inftable ul.genre li.genre a').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    const genreSlug = href.replace(/\/genre\/|\//g, '').trim();
    genres.push({ name, slug: genreSlug });
  });

  // Chapter buttons (Awal & Terbaru)
  const firstChapterEl = $('.linkbutt .new1').first().find('a');
  const latestChapterEl = $('.linkbutt .new1').eq(1).find('a');

  // Parse all chapters list
  const chapters = [];
  $('#Daftar_Chapter tbody tr').each((_, el) => {
    const titleLink = $(el).find('.judulseries a');
    if (!titleLink.length) return;

    const chapterTitle = titleLink.text().trim();
    const href = titleLink.attr('href') || '';
    const chapterSlug = extractChapterSlug(href);
    const date = $(el).find('.tanggalseries').text().trim();

    chapters.push({
      title: chapterTitle,
      slug: chapterSlug,
      date
    });
  });

  const detail = {
    title,
    altTitle,
    slug,
    thumbnail,
    synopsis,
    type: info['Tipe'] || 'Manga',
    status: info['Status'] || 'Ongoing',
    author: info['Author'] || 'Unknown',
    tema: info['Tema'] || '',
    caraBaca: info['Cara Baca'] || '',
    genres,
    firstChapter: {
      title: firstChapterEl.find('span').last().text().trim(),
      slug: extractChapterSlug(firstChapterEl.attr('href'))
    },
    latestChapter: {
      title: latestChapterEl.find('span').last().text().trim(),
      slug: extractChapterSlug(latestChapterEl.attr('href'))
    },
    chapters
  };

  setCached(cacheKey, detail, 120);
  return detail;
}

/**
 * 5. GET CHAPTER READER DATA
 * Fetches https://komiku.org/{chapter-slug}/
 */
async function getChapter(chapterSlug) {
  if (!chapterSlug) throw new Error('Chapter slug is required');
  const cleanSlug = extractChapterSlug(chapterSlug);
  const cacheKey = `chapter_${cleanSlug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/${cleanSlug}/`;
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 12000 });
  const $ = cheerio.load(res.data);

  const title = $('header h1').text().trim();

  // Extract comic info
  const comicLink = $('.toolbar a[aria-label="List"]').attr('href') || $('a.rl').next('a').attr('href') || '';
  const comicSlug = extractSlug(comicLink);
  const comicTitle = $('.toolbar a[aria-label="List"]').attr('title') || $('span[itemprop="isPartOf"] meta[itemprop="name"]').attr('content') || '';

  // Extract prev and next chapter
  const prevLink =
    $('.toolbar a[aria-label="Prev"]').attr('href') ||
    $('.nxpr a.rl').attr('href') ||
    '';
  const prevChapterSlug = extractChapterSlug(prevLink);

  const nextLink =
    $('.toolbar a[aria-label="Next"]').attr('href') ||
    $('.nxpr a.rr').attr('href') ||
    '';
  const nextChapterSlug = extractChapterSlug(nextLink);

  // Extract chapter images
  const images = [];
  $('#Baca_Komik img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (!src) return;
    // Skip ad banner / promo images
    if (src.includes('komiku-promosi') || src.includes('promooktober') || src.includes('iklan')) {
      return;
    }
    // Check if it's a chapter image
    const isChapterImage =
      src.includes('img.komiku.org') ||
      src.includes('thumbnail.komiku.to') ||
      src.includes('upload') ||
      $(el).hasClass('klazy') ||
      $(el).attr('id');

    if (isChapterImage) {
      images.push({
        index: images.length + 1,
        url: src,
        proxiedUrl: `/api/proxy-image?url=${encodeURIComponent(src)}`
      });
    }
  });

  const data = {
    title,
    chapterSlug: cleanSlug,
    comicTitle,
    comicSlug,
    prevChapterSlug: prevChapterSlug !== cleanSlug ? prevChapterSlug : '',
    nextChapterSlug: nextChapterSlug !== cleanSlug ? nextChapterSlug : '',
    totalImages: images.length,
    images
  };

  setCached(cacheKey, data, 300);
  return data;
}

/**
 * 6. GET GENRES LIST
 */
function getGenres() {
  return [
    { slug: 'action', name: 'Action' },
    { slug: 'adventure', name: 'Adventure' },
    { slug: 'comedy', name: 'Comedy' },
    { slug: 'drama', name: 'Drama' },
    { slug: 'fantasy', name: 'Fantasy' },
    { slug: 'horror', name: 'Horror' },
    { slug: 'isekai', name: 'Isekai' },
    { slug: 'martial-arts', name: 'Martial Arts' },
    { slug: 'mystery', name: 'Mystery' },
    { slug: 'psychological', name: 'Psychological' },
    { slug: 'reincarnation', name: 'Reincarnation' },
    { slug: 'romance', name: 'Romance' },
    { slug: 'school-life', name: 'School Life' },
    { slug: 'sci-fi', name: 'Sci-Fi' },
    { slug: 'seinen', name: 'Seinen' },
    { slug: 'shounen', name: 'Shounen' },
    { slug: 'slice-of-life', name: 'Slice of Life' },
    { slug: 'sports', name: 'Sports' },
    { slug: 'supernatural', name: 'Supernatural' },
    { slug: 'thriller', name: 'Thriller' },
    { slug: 'tragedy', name: 'Tragedy' },
    { slug: 'historical', name: 'Historical' },
    { slug: 'magic', name: 'Magic' },
    { slug: 'ecchi', name: 'Ecchi' },
    { slug: 'harem', name: 'Harem' }
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
