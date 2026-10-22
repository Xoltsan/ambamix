import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ComicCard from '../components/ComicCard';
import { Search, Compass } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.status === 'success') {
          setResults(json.data || []);
        } else {
          setError(json.message || 'Gagal mencari komik');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    doSearch();
  }, [query]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.4rem'
          }}
        >
          <Search size={24} color="var(--accent-red)" />
          <span>Hasil Pencarian: <span style={{ color: 'var(--accent-red)' }}>"{query}"</span></span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Ditemukan {results.length} komik yang cocok
        </p>
      </div>

      {isLoading ? (
        <div className="comic-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3 / 4.4', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          <Compass size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
            Tidak ada komik yang ditemukan
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Coba periksa ejaan judul atau gunakan kata kunci umum seperti <em>"Solo"</em>, <em>"One Piece"</em>, atau <em>"Jujutsu"</em>.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Jelajahi Pustaka Lengkap
          </Link>
        </div>
      ) : (
        <div className="comic-grid">
          {results.map((comic, idx) => (
            <ComicCard key={`${comic.slug}-${idx}`} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}
