const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/api');

const app = express();

const portArg = process.argv.find(arg => arg.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1], 10) : (process.env.PORT || 3800);

app.use(cors());
app.use(express.json());

// Anti-Search Engine Headers
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend Static Files (from frontend/dist if built)
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving frontend static assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
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
}

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    details: err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`⚡ KitsuMix backend running on http://localhost:${PORT}`);
    console.log(`📖 API Endpoints ready at http://localhost:${PORT}/api/home`);
  });
}

module.exports = app;
