import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldAlert, Heart } from 'lucide-react';
import KitsuLogo from './KitsuLogo';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        padding: '3rem 0 2rem'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.9rem' }}>
              <KitsuLogo size={32} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Kitsu<span style={{ color: 'var(--accent-red)' }}>Mix</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Platform pembaca komik online modern bertema Kitsune dengan koleksi lengkap Manga, Manhwa, dan Manhua berbahasa Indonesia.
            </p>
          </div>

          {/* Quick Nav */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Navigasi Cepat
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)' }}>Beranda</Link>
              </li>
              <li>
                <Link to="/browse" style={{ color: 'var(--text-secondary)' }}>Pustaka Komik</Link>
              </li>
              <li>
                <Link to="/browse?tipe=manga" style={{ color: 'var(--text-secondary)' }}>Manga Jepang</Link>
              </li>
              <li>
                <Link to="/browse?tipe=manhwa" style={{ color: 'var(--text-secondary)' }}>Manhwa Korea</Link>
              </li>
              <li>
                <Link to="/browse?tipe=manhua" style={{ color: 'var(--text-secondary)' }}>Manhua China</Link>
              </li>
            </ul>
          </div>

          {/* User Features */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Fitur Pembaca
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li>
                <Link to="/bookmarks" style={{ color: 'var(--text-secondary)' }}>Koleksi Tersimpan</Link>
              </li>
              <li>
                <Link to="/history" style={{ color: 'var(--text-secondary)' }}>Riwayat Baca Terakhir</Link>
              </li>
              <li>
                <a href="/api/home" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-red)' }}>
                  Dokumentasi REST API (JSON)
                </a>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ShieldAlert size={16} color="var(--accent-red)" />
              Disclaimer
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              KitsuMix tidak meng-host file komik apa pun di server kami. Semua komik, gambar, dan materi berhak cipta merupakan hak milik dari penerbit dan kreator aslinya.
            </p>
          </div>
        </div>

        {/* Bottom credits */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            © {new Date().getFullYear()} <strong>KitsuMix</strong>. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Dibuat untuk para pecinta komik Indonesia
          </div>
        </div>
      </div>
    </footer>
  );
}
