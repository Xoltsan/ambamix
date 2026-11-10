import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageWithProxy from '../components/ImageWithProxy';
import { Bookmark, BookOpen, ArrowUpDown, Search, User, Eye, ArrowLeft, Calendar } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function ComicDetail() {
  const { slug } = useParams();
  const [comic, setComic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [chapterSearch, setChapterSearch] = useState('');
  const [isDescending, setIsDescending] = useState(true);

  const { isBookmarked, toggleBookmark, history } = useBookmarks();
  const bookmarked = isBookmarked(slug);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/comic/${slug}`);
        const json = await res.json();
        if (json.status === 'success') {
          setComic(json.data);
        } else {
          setError(json.message || 'Gagal memuat detail komik');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        <div className="skeleton" style={{ height: '380px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !comic) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>Komik Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Detail untuk komik ini tidak tersedia.'}</p>
        <Link to="/browse" className="btn btn-primary">
          Kembali ke Pustaka
        </Link>
      </div>
    );
  }

  // Filter and sort chapters
  const allChapters = comic.chapters || [];
  const filteredChapters = allChapters.filter((ch) =>
    ch.title.toLowerCase().includes(chapterSearch.toLowerCase().trim())
  );
  const displayedChapters = isDescending ? [...filteredChapters] : [...filteredChapters].reverse();

  // Find if user has read any chapter of this comic in history
  const readHistory = history.find((h) => h.comicSlug === slug);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* 1. Header Banner with Backdrop */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#0d0f19',
          borderBottom: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        {/* Backdrop Ambient Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${comic.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            filter: 'blur(45px) brightness(0.2)',
            opacity: 0.65,
            transform: 'scale(1.15)'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, padding: '2.5rem 1.25rem' }}>
          {/* Back button */}
          <Link
            to="/browse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Pustaka
          </Link>

          <div
            style={{
              display: 'flex',
              gap: '2.25rem',
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}
          >
            {/* Left: Big Comic Cover */}
            <div
              style={{
                width: '240px',
                aspectRatio: '3 / 4.4',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid rgba(255, 255, 255, 0.14)',
                flexShrink: 0,
                backgroundColor: '#1b1e2c'
              }}
              className="detail-cover-wrap"
            >
              <ImageWithProxy
                src={comic.thumbnail}
                alt={comic.title}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Right: Metadata & Actions */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              {/* Type & Status Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`badge ${comic.type.toLowerCase().includes('manhwa') ? 'badge-manhwa' : comic.type.toLowerCase().includes('manhua') ? 'badge-manhua' : 'badge-manga'}`}>
                  {comic.type}
                </span>
                <span className="badge badge-status">
                  {comic.status}
                </span>
                {comic.tema && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255,255,255,0.06)'
                    }}
                  >
                    Tema: {comic.tema}
                  </span>
                )}
              </div>

              {/* Comic Title */}
              <h1
                style={{
                  fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#fff',
                  marginBottom: '0.4rem'
                }}
              >
                {comic.title}
              </h1>

              {/* Alt Title */}
              {comic.altTitle && (
                <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', fontStyle: 'italic' }}>
                  {comic.altTitle}
                </div>
              )}

              {/* Author & Reader Direction Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} color="var(--accent-red)" /> Author: <strong style={{ color: '#fff' }}>{comic.author}</strong>
                </span>
                {comic.caraBaca && (
                  <span>
                    Arah: <strong style={{ color: '#fff' }}>{comic.caraBaca}</strong>
                  </span>
                )}
              </div>

              {/* Genres list */}
              {comic.genres && comic.genres.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                  {comic.genres.map((g) => (
                    <Link
                      key={g.slug}
                      to={`/browse?genre=${g.slug}`}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                      className="genre-badge-hover"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                {readHistory ? (
                  <Link
                    to={`/chapter/${readHistory.chapterSlug}`}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    <BookOpen size={18} /> Lanjutkan: {readHistory.chapterTitle}
                  </Link>
                ) : comic.firstChapter && comic.firstChapter.slug ? (
                  <Link
                    to={`/chapter/${comic.firstChapter.slug}`}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    <BookOpen size={18} /> Mulai Baca (Ch. 1)
                  </Link>
                ) : null}

                {comic.latestChapter && comic.latestChapter.slug && (
                  <Link
                    to={`/chapter/${comic.latestChapter.slug}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.25rem' }}
                  >
                    Baca Terbaru ({comic.latestChapter.title})
                  </Link>
                )}

                <button
                  onClick={() => toggleBookmark(comic)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: bookmarked ? 'var(--accent-red-light)' : 'var(--bg-surface)',
                    borderColor: bookmarked ? 'var(--accent-red)' : 'var(--border-subtle)',
                    color: bookmarked ? 'var(--accent-red)' : 'var(--text-primary)'
                  }}
                >
                  <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
                  {bookmarked ? 'Tersimpan di Koleksi' : 'Tambah ke Koleksi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body: Synopsis & Chapter List */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        {/* Synopsis */}
        {comic.synopsis && (
          <section
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
              Sinopsis
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {comic.synopsis}
            </p>
          </section>
        )}

        {/* Chapters Section */}
        <section
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem'
          }}
        >
          {/* Chapter header & controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Daftar Chapter
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tersedia {allChapters.length} chapter
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Filter / Search Chapter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.4rem 0.75rem',
                  width: '180px'
                }}
              >
                <Search size={14} color="var(--text-muted)" style={{ marginRight: '0.4rem' }} />
                <input
                  type="text"
                  placeholder="Cari chapter..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.82rem',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Sort Order Button */}
              <button
                onClick={() => setIsDescending(!isDescending)}
                className="btn btn-secondary btn-sm"
                title="Ubah urutan chapter"
              >
                <ArrowUpDown size={14} />
                {isDescending ? 'Terbaru → Terlama' : 'Terlama → Terbaru'}
              </button>
            </div>
          </div>

          {/* Chapter Items List */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.65rem',
              maxHeight: '650px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}
          >
            {displayedChapters.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                Tidak ada chapter yang cocok dengan kata kunci "{chapterSearch}".
              </div>
            ) : (
              displayedChapters.map((ch) => {
                const isLastRead = readHistory && readHistory.chapterSlug === ch.slug;
                return (
                  <Link
                    key={ch.slug}
                    to={`/chapter/${ch.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isLastRead ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-primary)',
                      border: '1px solid',
                      borderColor: isLastRead ? 'var(--accent-blue)' : 'var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                    className="chapter-row-hover"
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: isLastRead ? 'var(--accent-blue)' : 'var(--text-primary)'
                        }}
                      >
                        {ch.title}
                      </div>
                      {isLastRead && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                          Terakhir Dibaca
                        </span>
                      )}
                    </div>

                    {ch.date && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Calendar size={12} /> {ch.date}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <style>{`
        .chapter-row-hover:hover {
          border-color: var(--accent-red) !important;
          background: var(--bg-surface-hover) !important;
        }
        .genre-badge-hover:hover {
          background: var(--bg-surface-hover) !important;
          border-color: var(--border-medium) !important;
          color: #fff !important;
        }
        @media (max-width: 600px) {
          .detail-cover-wrap {
            width: 100% !important;
            max-width: 200px !important;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
