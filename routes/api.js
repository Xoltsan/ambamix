const express = require('express');
const axios = require('axios');
const comicService = require('../services/voratoonService');

const router = express.Router();

/**
 * GET /api
 * Returns API index and list of available endpoints
 */
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    name: 'KitsuMix Comic API',
    version: '2.0.0',
    description: 'API & Frontend powered by Voratoon (https://v10.voratoon.com)',
    endpoints: {
      home: '/api/home',
      mangaList: '/api/manga?tipe=manga&genre=action&page=1',
      search: '/api/search?q=solo+leveling',
      comicDetail: '/api/comic/:slug',
      chapterReader: '/api/chapter/:slug',
      genres: '/api/genres',
      proxyImage: '/api/proxy-image?url=...'
    }
  });
});

/**
 * Universal Image Proxy to bypass hotlink protection and CORS
 */
router.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ status: 'error', message: 'Missing url parameter' });
  }

  let referer = 'https://voratoon.co/';
  let origin = 'https://voratoon.co';
  if (imageUrl.includes('komiku')) {
    referer = 'https://komiku.org/';
    origin = 'https://komiku.org';
  }

  try {
    const upstreamRes = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': origin,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 15000
    });

    const contentType = upstreamRes.headers['content-type'] || 'image/webp';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.send(Buffer.from(upstreamRes.data));
  } catch (err) {
    return res.status(502).json({
      status: 'error',
      message: 'Failed to proxy image',
      details: err.message
    });
  }
});

/**
 * GET /api/home
 */
router.get('/home', async (req, res) => {
  try {
    const data = await comicService.getHome();
    res.json({
      status: 'success',
      source: 'https://v10.voratoon.com/',
      data
    });
  } catch (err) {
    console.error('[API /home error]', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch home data',
      details: err.message
    });
  }
});

/**
 * GET /api/manga
 * Query params: page, limit, tipe, genre, status, search
 */
router.get('/manga', async (req, res) => {
  try {
    const result = await comicService.getMangaList(req.query);
    res.json({
      status: 'success',
      source: 'https://v10.voratoon.com/',
      ...result
    });
  } catch (err) {
    console.error('[API /manga error]', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manga list',
      details: err.message
    });
  }
});

/**
 * GET /api/search
 * Query params: q
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.keyword || '';
    const results = await comicService.searchManga(query);
    res.json({
      status: 'success',
      query,
      data: results
    });
  } catch (err) {
    console.error('[API /search error]', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search manga',
      details: err.message
    });
  }
});

/**
 * GET /api/comic/:slug
 */
router.get('/comic/:slug', async (req, res) => {
  try {
    const detail = await comicService.getComicDetail(req.params.slug);
    res.json({
      status: 'success',
      data: detail
    });
  } catch (err) {
    console.error(`[API /comic/${req.params.slug} error]`, err.message);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch comic: ${req.params.slug}`,
      details: err.message
    });
  }
});

/**
 * GET /api/chapter/:slug
 */
router.get('/chapter/:slug', async (req, res) => {
  try {
    const chapterData = await comicService.getChapter(req.params.slug);
    res.json({
      status: 'success',
      data: chapterData
    });
  } catch (err) {
    console.error(`[API /chapter/${req.params.slug} error]`, err.message);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch chapter: ${req.params.slug}`,
      details: err.message
    });
  }
});

/**
 * GET /api/genres
 */
router.get('/genres', async (req, res) => {
  try {
    const genres = await comicService.getGenres();
    res.json({
      status: 'success',
      data: genres
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch genres'
    });
  }
});

module.exports = router;
