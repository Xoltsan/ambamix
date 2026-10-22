import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ComicCard from '../components/ComicCard';
import ImageWithProxy from '../components/ImageWithProxy';
import { Flame, Trophy, Clock, ArrowRight, Play, BookOpen, Sparkles, Filter } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function Home() {
  const [homeData, setHomeData] = useState(null);
  const [rankTab, setRankTab] = useState('harian'); // 'harian' | 'mingguan'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Manga' | 'Manhwa' | 'Manhua'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { history } = useBookmarks();
  const lastRead = history && history.length > 0 ? history[0] : null;

  useEffect(() => {
    async function fetchHome() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/home');
        const json = await res.json();
        if (json.status === 'success') {
          setHomeData(json.data);
        } else {
          setError(json.message || 'Gagal memuat data beranda');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHome();
  }, []);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '2rem 1.25rem' }}>
        {/* Skeleton Hero */}
        <div className="skeleton" style={{ width: '100%', height: '360px', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem' }} />
        {/* Skeleton Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/4.5', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-red)', marginBottom: '1rem' }}>Gagal Memuat Data</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Terjadi kesalahan saat mengambil data dari server.'}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const { rankHarian = [], rankMingguan = [], terbaru = [] } = homeData;
  const currentRankList = rankTab === 'harian' ? rankHarian : rankMingguan;
  const heroComic = rankHarian.length > 0 ? rankHarian[0] : null;

  // Filtered Terbaru list
  const filteredTerbaru = terbaru.filter((comic) => {
    if (typeFilter === 'all') return true;
    return (comic.type || '').toLowerCase() === typeFilter.toLowerCase();
  });

  return (
    <div style={{ paddingBottom: '3.5rem' }}>
      {/* 1. Hero Feature Section */}
      {heroComic && (
        <section
          style={{
            position: 'relative',
            backgroundColor: '#0d0f18',
            borderBottom: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${heroComic.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              filter: 'blur(36px) brightness(0.2)',
              opacity: 0.6,
              transform: 'scale(1.1)'
            }}
          />

          <div
            className="container"
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '3rem 1.25rem 3.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2.5rem',
              flexWrap: 'wrap'
            }}
          >
            {/* Hero Left Content */}
            <div style={{ maxWidth: '620px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 70, 85, 0.18)',
                  border: '1px solid rgba(255, 70, 85, 0.4)',
                  color: 'var(--accent-red)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <Flame size={14} /> Peringkat #1 Terpopuler Hari Ini
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#fff',
                  marginBottom: '0.85rem'
                }}
              >
                {heroComic.title}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {heroComic.info} • Ikuti perkembangan cerita terbaru dan nikmati pengalaman membaca yang lancar tanpa gangguan iklan.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                {heroComic.latestChapterSlug && (
                  <Link
                    to={`/chapter/${heroComic.latestChapterSlug}`}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  >
                    <BookOpen size={18} /> Baca {heroComic.latestChapter}
                  </Link>
                )}
                <Link
                  to={`/comic/${heroComic.slug}`}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                >
                  Detail Komik
                </Link>
              </div>
            </div>

            {/* Hero Right Cover Card */}
            <div
              style={{
                width: '230px',
                height: '310px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid rgba(255, 255, 255, 0.12)',
                flexShrink: 0,
                display: 'none'
              }}
              className="hero-cover-desktop"
            >
              <ImageWithProxy
                src={heroComic.thumbnail}
                alt={heroComic.title}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 2. Resume Reading Banner (If user has read something) */}
      {lastRead && (
        <div className="container" style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #181c2b 0%, #131622 100%)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.04em' }}>
                  Lanjut Membaca Terakhir
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                  {lastRead.comicTitle} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lastRead.chapterTitle})</span>
                </div>
              </div>
            </div>

            <Link
              to={`/chapter/${lastRead.chapterSlug}`}
              className="btn btn-blue btn-sm"
              style={{ fontWeight: 700 }}
            >
              Lanjutkan Baca →
            </Link>
          </div>
        </div>
      )}

      {/* 3. Main Content: Rankings & Latest Updates */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2.5rem' }} className="home-main-grid">
          {/* Left Column: Komik Terbaru */}
          <div>
            <div className="section-title-wrap">
              <div className="section-title">
                <Clock size={22} />
                <span>Rilisan Terbaru</span>
              </div>
              <Link to="/browse" className="section-more-link">
                Semua Komik <ArrowRight size={14} />
              </Link>
            </div>

            {/* Quick Type Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {[
                { id: 'all', label: 'Semua Tipe' },
                { id: 'Manga', label: '🇯🇵 Manga' },
                { id: 'Manhwa', label: '🇰🇷 Manhwa' },
                { id: 'Manhua', label: '🇨🇳 Manhua' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: typeFilter === tab.id ? 'var(--accent-red)' : 'var(--bg-surface)',
                    color: typeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: typeFilter === tab.id ? 'var(--accent-red)' : 'var(--border-subtle)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Comic Cards Grid */}
            <div className="comic-grid">
              {filteredTerbaru.map((comic, idx) => (
                <ComicCard key={`${comic.slug}-${idx}`} comic={comic} />
              ))}
            </div>
          </div>

          {/* Right Column: Peringkat Komiku (Leaderboard) */}
          <aside>
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem',
                position: 'sticky',
                top: 'calc(var(--header-height) + 1.5rem)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                  <Trophy size={18} color="var(--accent-gold)" />
                  <span>Peringkat Komik</span>
                </div>
                {/* Ranking Period Switcher */}
                <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', padding: '2px' }}>
                  <button
                    onClick={() => setRankTab('harian')}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-xs)',
                      background: rankTab === 'harian' ? 'var(--accent-red)' : 'none',
                      color: rankTab === 'harian' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    Harian
                  </button>
                  <button
                    onClick={() => setRankTab('mingguan')}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-xs)',
                      background: rankTab === 'mingguan' ? 'var(--accent-red)' : 'none',
                      color: rankTab === 'mingguan' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    Mingguan
                  </button>
                </div>
              </div>

              {/* Ranking Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentRankList.slice(0, 9).map((item, index) => (
                  <Link
                    key={`${item.slug}-${index}`}
                    to={`/comic/${item.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.15s ease, background 0.15s ease'
                    }}
                    className="rank-item-hover"
                  >
                    {/* Rank Number */}
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor:
                          index === 0
                            ? 'var(--accent-gold)'
                            : index === 1
                            ? '#94a3b8'
                            : index === 2
                            ? '#b45309'
                            : 'transparent',
                        color: index < 3 ? '#000' : 'var(--text-muted)',
                        flexShrink: 0
                      }}
                    >
                      {item.rank || index + 1}
                    </span>

                    {/* Small thumbnail */}
                    <div
                      style={{
                        width: '38px',
                        height: '50px',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#1a1d29'
                      }}
                    >
                      <ImageWithProxy
                        src={item.thumbnail}
                        alt={item.title}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Meta info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '0.15rem'
                        }}
                      >
                        {item.info}
                      </div>
                      {item.latestChapter && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', fontWeight: 600, marginTop: '0.1rem' }}>
                          {item.latestChapter}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hero-cover-desktop {
            display: block !important;
          }
        }
        @media (max-width: 960px) {
          .home-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .rank-item-hover:hover {
          border-color: var(--accent-red) !important;
          background: var(--bg-surface-hover) !important;
        }
      `}</style>
    </div>
  );
}
