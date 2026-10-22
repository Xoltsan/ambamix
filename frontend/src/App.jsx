import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { BookmarkProvider } from './context/BookmarkContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ComicDetail from './pages/ComicDetail';
import ChapterReader from './pages/ChapterReader';
import SearchPage from './pages/SearchPage';
import Bookmarks from './pages/Bookmarks';
import History from './pages/History';

function AppLayout() {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/chapter/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isReaderPage && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/comic/:slug" element={<ComicDetail />} />
          <Route path="/chapter/:chapterSlug" element={<ChapterReader />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/history" element={<History />} />
          <Route
            path="*"
            element={
              <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-red)', marginBottom: '1rem' }}>
                  404
                </h1>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.75rem' }}>
                  Halaman Tidak Ditemukan
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
                  Halaman komik yang kamu tuju mungkin telah dipindahkan atau dihapus.
                </p>
                <Link to="/" className="btn btn-primary">
                  Kembali ke Beranda
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      {!isReaderPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BookmarkProvider>
        <AppLayout />
      </BookmarkProvider>
    </BrowserRouter>
  );
}
