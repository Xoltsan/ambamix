# ⚡ AmbaMix - VoraToon Comic Reader & REST API

**AmbaMix** adalah aplikasi pembaca komik (Manga, Manhwa, Manhua) modern berbahasa Indonesia dan REST API lengkap yang terhubung langsung dengan sumber data **[VoraToon](https://v10.voratoon.com)** (`https://api.voratoon.com`).

Dibuat dengan arsitektur fullstack:
- **Backend API**: Node.js & Express dengan Cheerio & Axios web scraping teroptimasi serta image proxy berkecepatan tinggi.
- **Frontend App**: React 19, Vite, React Router, dan Vanilla CSS murni dengan desain manga editorial dark mode yang estetis, responsif, dan bebas iklan.

---

## 🚀 Fitur Utama

- 🏠 **Beranda Interaktif**: Hero spotlight peringkat #1 harian, tab leaderboard peringkat harian vs mingguan, dan rilisan komik terbaru real-time.
- 📖 **Pustaka Komik (Browse)**: Multi-filter berdasarkan Tipe (Manga 🇯🇵, Manhwa 🇰🇷, Manhua 🇨🇳), Status (Ongoing / Tamat), Urutan (Terbaru, Rilis Baru, Acak), dan Genre.
- 🔍 **Live Search**: Pencarian instan dengan auto-suggest dropdown saat mengetik serta halaman hasil pencarian lengkap.
- 📑 **Detail Komik Lengkap**: Sinopsis, metadata (author, tema, status, cara baca), genre badges, dan pencarian instan chapter ("Cari chapter...").
- 👓 **Modern Chapter Reader**:
  - Pilihan mode baca: **Webtoon (Continuous Vertical Scroll)** atau **Per Halaman (Single Page)**.
  - Pilihan zoom lebar tampilan (720px, 880px, 100%).
  - Navigasi chapter cepat (Previous / Next / Dropdown Switcher).
  - Mode Layar Penuh (Fullscreen).
- 💾 **Koleksi & Riwayat (Bookmark & History)**:
  - Tersimpan di `localStorage` tanpa perlu login wajib.
  - Banner **"Lanjut Baca"** otomatis di beranda dan detail komik untuk melanjutkan chapter terakhir yang dibaca.
- 🛡️ **Image Proxy Bawaan**: Mengatasi masalah hotlink protection, referrer blocking, dan CORS dari CDN penyedia gambar.

---

## 📡 Dokumentasi REST API

Semua endpoint menghasilkan response berformat JSON.

### 1. `GET /api/home`
Mengambil data beranda: Peringkat Harian, Peringkat Mingguan, dan Komik Terbaru.
```json
{
  "status": "success",
  "data": {
    "rankHarian": [
      {
        "rank": 1,
        "title": "Ao Ashi",
        "slug": "ao-ashi",
        "thumbnail": "https://thumbnail.komiku.to/...",
        "info": "Drama · 22,017 views",
        "latestChapter": "Chapter 410",
        "latestChapterSlug": "ao-ashi-chapter-410"
      }
    ],
    "rankMingguan": [...],
    "terbaru": [
      {
        "title": "Stalker x Stalker",
        "slug": "stalker-x-stalker",
        "thumbnail": "https://thumbnail.komiku.to/...",
        "type": "Manhua",
        "info": "Romantis · 17 menit lalu",
        "chapter": "Chapter 230",
        "chapterSlug": "stalker-x-stalker-chapter-230"
      }
    ]
  }
}
```

### 2. `GET /api/manga` (Katalog Pustaka)
Mengambil daftar komik dengan filter dan pagination.
- Query Parameters:
  - `page`: nomor halaman (default: `1`)
  - `tipe`: `manga`, `manhwa`, atau `manhua`
  - `genre`: slug genre (contoh: `action`, `romance`, `isekai`)
  - `status`: `ongoing` atau `end`
  - `orderby`: `modified` (terbaru), `date` (judul baru), `rand` (acak)

Contoh request:
```
GET /api/manga?tipe=manhwa&genre=fantasy&page=1
```

### 3. `GET /api/search?q={query}`
Mencari komik berdasarkan judul atau kata kunci.
Contoh:
```
GET /api/search?q=solo+leveling
```

### 4. `GET /api/comic/:slug`
Mengambil informasi detail komik dan seluruh daftar chapternya.
Contoh:
```
GET /api/comic/ao-ashi
```
Response mencakup: `title`, `altTitle`, `thumbnail`, `synopsis`, `type`, `status`, `author`, `genres`, `firstChapter`, `latestChapter`, dan array `chapters: [{ title, slug, date }]`.

### 5. `GET /api/chapter/:slug`
Mengambil daftar URL gambar dalam satu chapter untuk dibaca.
Contoh:
```
GET /api/chapter/ao-ashi-chapter-410
```
Response:
```json
{
  "status": "success",
  "data": {
    "title": "Ao Ashi Chapter 410",
    "chapterSlug": "ao-ashi-chapter-410",
    "comicTitle": "Ao Ashi",
    "comicSlug": "ao-ashi",
    "prevChapterSlug": "ao-ashi-chapter-409",
    "nextChapterSlug": "",
    "totalImages": 32,
    "images": [
      {
        "index": 1,
        "url": "https://img.komiku.org/upload5/ao-ashi/410/2026-09-25/1.webp",
        "proxiedUrl": "/api/proxy-image?url=..."
      }
    ]
  }
}
```

### 6. `GET /api/genres`
Daftar seluruh genre komik yang tersedia.

### 7. `GET /api/proxy-image?url={imageUrl}`
Proxy stream gambar dengan header `Referer: https://komiku.org/` dan caching browser selama 24 jam.

---

## 💻 Cara Menjalankan Proyek

### 1. Jalankan Server Fullstack (Backend + Frontend Bundle)
```bash
cd ambamix
npm start
```
Buka browser di **`http://localhost:3800`**

### 2. Mode Pengembangan (Development Mode)
Jalankan backend:
```bash
cd ambamix
npm run dev
```

Buka terminal kedua untuk menjalankan Vite dev server frontend:
```bash
```
Buka browser di **`http://localhost:5174`** (Vite otomatis mem-proxy request `/api` ke backend di port 3800).

## ⚠️ Catatan Edukasi & Disclaimer

Proyek ini dibuat murni untuk tujuan riset, pembelajaran reverse engineering, analisis keamanan jaringan, dan interoperabilitas perangkat lunak. Konten hak cipta dimiliki sepenuhnya oleh pemegang hak cipta masing-masing.

