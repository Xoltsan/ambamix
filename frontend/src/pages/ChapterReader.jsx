import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ImageWithProxy from '../components/ImageWithProxy';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  List,
  Layout,
  ZoomIn,
  ZoomOut,
  ArrowUp
} from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function ChapterReader() {
  const { chapterSlug } = useParams();
  const navigate = useNavigate();
  const { recordHistory } = useBookmarks();

  const [chapter, setChapter] = useState(null);
  const [comicDetail, setComicDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reader Settings
  const [readingMode, setReadingMode] = useState('webtoon'); // 'webtoon' | 'single'
  const [maxWidthIndex, setMaxWidthIndex] = useState(1); // 0: 700px, 1: 850px, 2: 100%
  const widthOptions = ['720px', '880px', '100%'];
  const [pageIndex, setPageIndex] = useState(0); // for single-page mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch chapter data
  useEffect(() => {
    async function fetchChapterData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chapter/${chapterSlug}`);
        const json = await res.json();
        if (json.status === 'success') {
          setChapter(json.data);
          setPageIndex(0);

          // Record reading history
          recordHistory({
            comicSlug: json.data.comicSlug,
            comicTitle: json.data.comicTitle || json.data.title,
            chapterSlug,
            chapterTitle: json.data.title
          });

          // Fetch comic detail to populate chapter switcher dropdown if comicSlug available
          if (json.data.comicSlug) {
            fetch(`/api/comic/${json.data.comicSlug}`)
              .then((r) => r.json())
              .then((detailJson) => {
                if (detailJson.status === 'success') {
                  setComicDetail(detailJson.data);
                }
              })
              .catch(() => {});
          }
        } else {
          setError(json.message || 'Gagal memuat chapter');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
    fetchChapterData();
  }, [chapterSlug]);

  // Keyboard navigation for single page and arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        if (readingMode === 'single') {
          setPageIndex((prev) => (chapter && prev < chapter.images.length - 1 ? prev + 1 : prev));
        } else if (chapter && chapter.nextChapterSlug) {
          navigate(`/chapter/${chapter.nextChapterSlug}`);
        }
      } else if (e.key === 'ArrowLeft') {
        if (readingMode === 'single') {
          setPageIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (chapter && chapter.prevChapterSlug) {
          navigate(`/chapter/${chapter.prevChapterSlug}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter, readingMode, navigate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div className="skeleton" style={{ width: '80%', height: '50px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ width: '600px', height: '600px', borderRadius: 'var(--radius-md)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Menyiapkan halaman komik...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="container" style={{ padding: '6rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>Gagal Memuat Chapter</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Gambar chapter tidak dapat diakses.'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Kembali
        </button>
      </div>
    );
  }

  const { title, images = [], prevChapterSlug, nextChapterSlug, comicSlug, comicTitle } = chapter;
  const currentImage = images[pageIndex];

  return (
    <div style={{ backgroundColor: '#07080b', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Sticky Top Control Bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backgroundColor: 'rgba(13, 15, 23, 0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.65rem 1rem'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Back & Comic title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to={comicSlug ? `/comic/${comicSlug}` : '/browse'}
              className="btn btn-secondary btn-sm"
              title="Kembali ke Detail Komik"
              style={{ padding: '0.45rem' }}
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: '#fff',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {comicTitle || title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {title}
              </div>
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {prevChapterSlug && (
              <Link
                to={`/chapter/${prevChapterSlug}`}
                className="btn btn-secondary btn-sm"
                title="Chapter Sebelumnya"
              >
                <ChevronLeft size={16} /> <span className="hide-mobile">Prev</span>
              </Link>
            )}

            {comicDetail && comicDetail.chapters ? (
              <select
                value={chapterSlug}
                onChange={(e) => navigate(`/chapter/${e.target.value}`)}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {comicDetail.chapters.map((ch) => (
                  <option key={ch.slug} value={ch.slug}>
                    {ch.title}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '0.45rem 0.75rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {title}
              </span>
            )}

            {nextChapterSlug && (
              <Link
                to={`/chapter/${nextChapterSlug}`}
                className="btn btn-primary btn-sm"
                title="Chapter Selanjutnya"
              >
                <span className="hide-mobile">Next</span> <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {/* Reader Preferences (Mode & Zoom) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Reading Mode Switcher */}
            <button
              onClick={() => setReadingMode(readingMode === 'webtoon' ? 'single' : 'webtoon')}
              className="btn btn-secondary btn-sm"
              title={readingMode === 'webtoon' ? 'Ganti ke Mode Halaman (Single Page)' : 'Ganti ke Mode Gulir Vertikal (Webtoon)'}
            >
              <Layout size={15} />
              <span className="hide-mobile">{readingMode === 'webtoon' ? 'Webtoon' : 'Per Halaman'}</span>
            </button>

            {/* Width zoom */}
            {readingMode === 'webtoon' && (
              <button
                onClick={() => setMaxWidthIndex((prev) => (prev + 1) % widthOptions.length)}
                className="btn btn-secondary btn-sm"
                title="Sesuaikan Lebar Gambar"
              >
                <ZoomIn size={15} />
                <span className="hide-mobile">{widthOptions[maxWidthIndex]}</span>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary btn-sm"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Comic Images Reading Area */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: readingMode === 'webtoon' ? widthOptions[maxWidthIndex] : '960px',
          margin: '0 auto',
          padding: readingMode === 'webtoon' ? '1rem 0' : '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {images.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Tidak ada gambar yang ditemukan untuk chapter ini.</p>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Continuous Scroll View */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {images.map((img) => (
              <div key={img.index} style={{ width: '100%', position: 'relative' }}>
                <ImageWithProxy
                  src={img.url}
                  alt={`${title} - Hal. ${img.index}`}
                  loading="lazy"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Single Page View */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (clickX > rect.width / 2) {
                  // Click right side -> next page
                  setPageIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
                } else {
                  // Click left side -> prev page
                  setPageIndex((prev) => (prev > 0 ? prev - 1 : prev));
                }
              }}
            >
              {currentImage && (
                <ImageWithProxy
                  src={currentImage.url}
                  alt={`${title} - Halaman ${pageIndex + 1}`}
                  loading="eager"
                  style={{ maxHeight: '85vh', width: 'auto', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Paging controls */}
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex <= 0}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>

              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Halaman {pageIndex + 1} dari {images.length}
              </span>

              <button
                onClick={() => setPageIndex((p) => Math.min(images.length - 1, p + 1))}
                disabled={pageIndex >= images.length - 1}
                className="btn btn-secondary btn-sm"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Bottom Chapter Navigation & Quick Jump */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '2.5rem 1.25rem 3rem',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            Selesai membaca {title}
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
            {prevChapterSlug && (
              <Link
                to={`/chapter/${prevChapterSlug}`}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '160px', padding: '0.85rem' }}
              >
                <ChevronLeft size={18} /> Chapter Sebelumnya
              </Link>
            )}

            {nextChapterSlug && (
              <Link
                to={`/chapter/${nextChapterSlug}`}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '160px', padding: '0.85rem' }}
              >
                Chapter Berikutnya <ChevronRight size={18} />
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to={comicSlug ? `/comic/${comicSlug}` : '/browse'} className="btn btn-ghost btn-sm">
              <List size={16} /> Daftar Chapter
            </Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn btn-ghost btn-sm"
            >
              <ArrowUp size={16} /> Ke Atas
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
