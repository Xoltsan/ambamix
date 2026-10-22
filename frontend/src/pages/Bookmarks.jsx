import React from 'react';
import { Link } from 'react-router-dom';
import ComicCard from '../components/ComicCard';
import { Bookmark, Compass } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function Bookmarks() {
  const { bookmarks } = useBookmarks();

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.4rem'
          }}
        >
          <Bookmark size={26} color="var(--accent-red)" fill="var(--accent-red)" />
          <span>Koleksi Komik Tersimpan</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Daftar komik favorit yang kamu simpan untuk dibaca kembali kapan saja.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '560px',
            margin: '0 auto'
          }}
        >
          <Bookmark size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
            Koleksi Kamu Masih Kosong
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Klik ikon bookmark pada kartu komik atau halaman detail komik untuk menambahkannya ke daftar favoritmu.
          </p>
          <Link to="/browse" className="btn btn-primary">
            <Compass size={16} /> Jelajahi Komik Sekarang
          </Link>
        </div>
      ) : (
        <div className="comic-grid">
          {bookmarks.map((comic) => (
            <ComicCard key={comic.slug} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}
