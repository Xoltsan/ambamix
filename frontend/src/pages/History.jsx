import React from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Trash2, BookOpen, Compass, X } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function History() {
  const { history, clearHistory, removeHistoryItem } = useBookmarks();

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
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
            <HistoryIcon size={26} color="var(--accent-blue)" />
            <span>Riwayat Bacaan</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Daftar komik dan chapter terakhir yang telah kamu buka.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Yakin ingin menghapus semua riwayat membaca?')) {
                clearHistory();
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={15} /> Hapus Semua Riwayat
          </button>
        )}
      </div>

      {history.length === 0 ? (
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
          <HistoryIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
            Belum Ada Riwayat Bacaan
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Chapter yang kamu buka akan otomatis tercatat di sini sehingga kamu bisa melanjutkan kapan saja.
          </p>
          <Link to="/" className="btn btn-primary">
            <Compass size={16} /> Mulai Membaca Komik
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {history.map((item) => (
            <div
              key={item.comicSlug}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                gap: '1.25rem',
                flexWrap: 'wrap'
              }}
              className="history-card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)',
                    flexShrink: 0
                  }}
                >
                  <BookOpen size={20} />
                </div>

                <div>
                  <Link
                    to={`/comic/${item.comicSlug}`}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#fff',
                      display: 'block',
                      marginBottom: '0.2rem'
                    }}
                  >
                    {item.comicTitle}
                  </Link>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Terakhir dibaca: <strong style={{ color: 'var(--accent-red)' }}>{item.chapterTitle}</strong>
                    {item.readAt && (
                      <span style={{ marginLeft: '0.75rem', opacity: 0.8 }}>
                        • {new Date(item.readAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Link
                  to={`/chapter/${item.chapterSlug}`}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.55rem 1.15rem' }}
                >
                  Lanjut Baca →
                </Link>

                <button
                  onClick={() => removeHistoryItem(item.comicSlug)}
                  className="btn btn-ghost btn-sm"
                  title="Hapus dari riwayat"
                  style={{ padding: '0.55rem' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .history-card-hover:hover {
          border-color: var(--border-medium);
        }
      `}</style>
    </div>
  );
}
