import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithProxy from './ImageWithProxy';
import { Bookmark, BookOpen } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function ComicCard({ comic }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(comic.slug);

  const getBadgeClass = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('manhwa')) return 'badge-manhwa';
    if (t.includes('manhua')) return 'badge-manhua';
    return 'badge-manga';
  };

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(comic);
  };

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        position: 'relative'
      }}
      className="comic-card-hover"
    >
      {/* Thumbnail Link */}
      <Link
        to={`/comic/${comic.slug}`}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4.2',
          display: 'block',
          overflow: 'hidden',
          backgroundColor: '#161925'
        }}
      >
        <ImageWithProxy
          src={comic.thumbnail}
          alt={comic.title}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Type Badge */}
        {comic.type && (
          <span
            className={`badge ${getBadgeClass(comic.type)}`}
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
            }}
          >
            {comic.type}
          </span>
        )}

        {/* Bookmark Quick Toggle Button */}
        <button
          onClick={handleBookmarkClick}
          aria-label={bookmarked ? 'Hapus dari Koleksi' : 'Tambah ke Koleksi'}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 2,
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: bookmarked ? 'var(--accent-red)' : 'rgba(4, 4, 74, 0.85)',
            backdropFilter: 'blur(4px)',
            color: bookmarked ? '#020216' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease, background 0.15s ease'
          }}
          title={bookmarked ? 'Tersimpan di Koleksi' : 'Simpan ke Koleksi'}
        >
          <Bookmark
            size={16}
            fill={bookmarked ? '#020216' : 'none'}
            strokeWidth={2.2}
          />
        </button>

        {/* Latest chapter overlay on bottom of card image */}
        {(comic.latestChapter || comic.chapter) && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.5rem 0.5rem 0.4rem',
              background: 'linear-gradient(to top, rgba(2,2,22,0.95) 0%, rgba(4,4,74,0.65) 60%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#f1f5f9'
            }}
          >
            <BookOpen size={13} color="var(--accent-red)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {comic.latestChapter || comic.chapter}
            </span>
          </div>
        )}
      </Link>

      {/* Card Info Content */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <Link
          to={`/comic/${comic.slug}`}
          title={comic.title}
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            lineHeight: 1.35,
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '0.4rem'
          }}
          className="title-hover"
        >
          {comic.title}
        </Link>

        {comic.info && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {comic.info}
          </div>
        )}

        {comic.genre && !comic.info && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {comic.genre}
          </div>
        )}
      </div>
    </article>
  );
}
