import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ComicCard from '../components/ComicCard';
import { Filter, ChevronLeft, ChevronRight, SlidersHorizontal, BookOpen } from 'lucide-react';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTipe = searchParams.get('tipe') || '';
  const currentGenre = searchParams.get('genre') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentOrderBy = searchParams.get('orderby') || 'modified';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Fetch genres list once
  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await fetch('/api/genres');
        const json = await res.json();
        if (json.status === 'success') {
          setGenres(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    }
    loadGenres();
  }, []);

  // Fetch manga list on query param change
  useEffect(() => {
    async function fetchManga() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams();
        if (currentTipe) query.append('tipe', currentTipe);
        if (currentGenre) query.append('genre', currentGenre);
        if (currentStatus) query.append('status', currentStatus);
        if (currentOrderBy) query.append('orderby', currentOrderBy);
        if (currentPage > 1) query.append('page', currentPage);

        const res = await fetch(`/api/manga?${query.toString()}`);
        const json = await res.json();
        if (json.status === 'success') {
          setComics(json.data || []);
          setHasMore(json.hasMore !== false && (json.data || []).length > 0);
        }
      } catch (err) {
        console.error('Failed to fetch manga catalog', err);
      } finally {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    fetchManga();
  }, [currentTipe, currentGenre, currentStatus, currentOrderBy, currentPage]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1'); // reset page on filter change
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem' }}>
      {/* Title & Filter Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen color="var(--accent-red)" size={28} />
          <span>Pustaka Komik</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Jelajahi ribuan judul Manga, Manhwa, dan Manhua terlengkap Bahasa Indonesia.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Type Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Tipe Komik
          </label>
          <select
            value={currentTipe}
            onChange={(e) => updateFilter('tipe', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Semua Tipe</option>
            <option value="manga">Manga (Jepang)</option>
            <option value="manhwa">Manhwa (Korea)</option>
            <option value="manhua">Manhua (China)</option>
          </select>
        </div>

        {/* Order By Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Urutkan Berdasarkan
          </label>
          <select
            value={currentOrderBy}
            onChange={(e) => updateFilter('orderby', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="modified">Chapter Terbaru</option>
            <option value="date">Komik Baru Rilis</option>
            <option value="rand">Acak (Random)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Status Cerita
          </label>
          <select
            value={currentStatus}
            onChange={(e) => updateFilter('status', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Semua Status</option>
            <option value="ongoing">Ongoing (Sedang Berjalan)</option>
            <option value="end">Tamat (Completed)</option>
          </select>
        </div>

        {/* Genre Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Genre
          </label>
          <select
            value={currentGenre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Semua Genre</option>
            {genres.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comic Grid */}
      {isLoading ? (
        <div className="comic-grid">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3 / 4.4', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : comics.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Tidak ada komik yang sesuai dengan filter yang dipilih.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="btn btn-secondary"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="comic-grid">
          {comics.map((comic, idx) => (
            <ComicCard key={`${comic.slug}-${idx}`} comic={comic} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '3rem'
        }}
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="btn btn-secondary"
          style={{
            opacity: currentPage <= 1 ? 0.4 : 1,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={18} /> Halaman Sebelumnya
        </button>

        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '0.5rem 1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          Halaman {currentPage}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasMore || isLoading}
          className="btn btn-secondary"
          style={{
            opacity: !hasMore ? 0.4 : 1,
            cursor: !hasMore ? 'not-allowed' : 'pointer'
          }}
        >
          Halaman Selanjutnya <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
