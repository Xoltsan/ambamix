import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bookmark, History, Compass, Menu, X, BookOpen, Flame } from 'lucide-react';

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // Debounced live search suggestions
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
        const data = await res.json();
        if (data.status === 'success') {
          setSuggestions((data.data || []).slice(0, 6));
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        height: 'var(--header-height)'
      }}
    >
      <div
        className="container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}
      >
        {/* Left: Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(255, 70, 85, 0.4)'
            }}
          >
            A
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#fff',
                lineHeight: 1.1
              }}
            >
              Amba<span style={{ color: 'var(--accent-red)' }}>Mix</span>
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              VoraToon Reader
            </span>
          </div>
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.25rem'
          }}
          className="desktop-nav"
        >
          <Link
            to="/"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: location.pathname === '/' ? 'var(--accent-red)' : 'var(--text-secondary)'
            }}
          >
            Beranda
          </Link>
          <Link
            to="/browse"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: location.pathname === '/browse' && !location.search ? 'var(--accent-red)' : 'var(--text-secondary)'
            }}
          >
            Pustaka
          </Link>
          <Link
            to="/browse?tipe=manga"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: location.search.includes('tipe=manga') ? '#fb7185' : 'var(--text-secondary)'
            }}
          >
            Manga
          </Link>
          <Link
            to="/browse?tipe=manhwa"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: location.search.includes('tipe=manhwa') ? '#a5b4fc' : 'var(--text-secondary)'
            }}
          >
            Manhwa
          </Link>
          <Link
            to="/browse?tipe=manhua"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: location.search.includes('tipe=manhua') ? '#fcd34d' : 'var(--text-secondary)'
            }}
          >
            Manhua
          </Link>
        </nav>

        {/* Right: Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '450px', justifyContent: 'flex-end' }}>
          {/* Live Search Input */}
          <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <form onSubmit={handleSearchSubmit}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.35rem 0.75rem',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '0.5rem' }} />
                <input
                  type="text"
                  placeholder="Cari komik, manga, manhwa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSuggestions([]);
                      setShowDropdown(false);
                    }}
                    style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-md)',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  zIndex: 200,
                  padding: '0.4rem'
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em'
                  }}
                >
                  Hasil Rekomendasi
                </div>
                {suggestions.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/comic/${item.slug}`}
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      transition: 'background 0.15s ease'
                    }}
                    className="dropdown-item-hover"
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '50px',
                        flexShrink: 0,
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        backgroundColor: '#1b1e2c'
                      }}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            background: 'var(--bg-primary)',
                            color: 'var(--accent-red)',
                            fontWeight: 700
                          }}
                        >
                          {item.type || 'Komik'}
                        </span>
                        {item.latestChapter && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.latestChapter}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  to={`/search?q=${encodeURIComponent(searchTerm.trim())}`}
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.6rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-red)',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '0.25rem'
                  }}
                >
                  Lihat Semua Hasil untuk "{searchTerm}" →
                </Link>
              </div>
            )}
          </div>

          {/* Bookmarks Link */}
          <Link
            to="/bookmarks"
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
            title="Koleksi Komik Saya"
          >
            <Bookmark size={19} />
          </Link>

          {/* History Link */}
          <Link
            to="/history"
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
            title="Riwayat Baca"
          >
            <History size={19} />
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            style={{
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.4rem'
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--header-height)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            zIndex: 99,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Link
            to="/"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: location.pathname === '/' ? 'var(--accent-red)' : 'var(--text-primary)'
            }}
          >
            Beranda
          </Link>
          <Link
            to="/browse"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: location.pathname === '/browse' && !location.search ? 'var(--accent-red)' : 'var(--text-primary)'
            }}
          >
            Pustaka Komik
          </Link>
          <Link
            to="/browse?tipe=manga"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fb7185'
            }}
          >
            Manga (Jepang)
          </Link>
          <Link
            to="/browse?tipe=manhwa"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#a5b4fc'
            }}
          >
            Manhwa (Korea)
          </Link>
          <Link
            to="/browse?tipe=manhua"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fcd34d'
            }}
          >
            Manhua (China)
          </Link>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />
          <Link
            to="/bookmarks"
            style={{
              padding: '0.6rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
          >
            <Bookmark size={18} color="var(--accent-red)" />
            Koleksi Komik Tersimpan
          </Link>
          <Link
            to="/history"
            style={{
              padding: '0.6rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
          >
            <History size={18} color="var(--accent-blue)" />
            Riwayat Baca
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
        .dropdown-item-hover:hover {
          background: var(--bg-surface-hover);
        }
      `}</style>
    </header>
  );
}
