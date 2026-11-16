<div align="center">

# Febrianggi Caesar Immanuel · Portofolio

Mahasiswa Statistika Universitas Padjadjaran · Analisis data dengan R, Python, dan Excel

[English](README.md) · **Bahasa Indonesia**

[**febrianggi.github.io**](https://febrianggi.github.io)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github&logoColor=white)

</div>

---

## Gambaran umum

Portofolio pribadi berbahasa Inggris yang dibangun dengan HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa proses build. Semua teks tentang diriku disimpan di file `.txt` biasa di folder `content/`, sehingga isi website bisa diperbarui tanpa menyentuh kode.

## Sistem desain: Teal Scientific

Tata letak editorial gelap dengan aksen ilmiah. Token warnanya ada di bagian atas `css/styles.css`.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| Latar | `#101517` | Halaman |
| Permukaan / terangkat | `#182124` / `#1A292D` | Panel, kartu, dialog |
| Aksen / hover | `#56C6CF` / `#79DCE3` | Nomor bagian, tautan, status aktif, tombol utama |
| Aksen tipis | `rgba(86,198,207,0.12)` | Filter terpilih, lencana |
| Teks / sekunder / redup | `#ECF9FA` / `#B4C5C9` / `#95A9AE` | Isi teks dan metadata |
| Garis | `rgba(236,249,250,0.10)` | Pemisah |

- **Huruf:** Plus Jakarta Sans dengan skala fluid dari `clamp()`: hero 42 sampai 72 px, judul bagian 32 sampai 44 px, judul proyek 26 sampai 36 px, judul kartu 18 sampai 22 px, isi 15 sampai 17 px, metadata 13 sampai 14 px.
- **Jarak:** kelipatan 4 px (`--s1` sampai `--s9`), lebar konten 1280 px, jarak antarbagian 72 sampai 120 px.
- **Radius:** 6 px chip, 10 px tombol, 16 px kartu dan gambar.
- **Kontras:** setiap pasangan teks dan latar minimal 6:1 (WCAG AA).

## Bagian website

| # | Bagian | Isi |
|---|---|---|
| | **Hero** | Teks kecil, nama, kalimat posisi, pengantar singkat, tombol Explore my work / Contact me, tautan sosial, foto profil |
| 01 | **About & Core Competencies** | About Me, pendidikan, sorotan prestasi, technical skills berkelompok yang menyaring proyek |
| 02 | **Selected Projects** | Satu studi kasus per baris dengan screenshot besar (sisi bergantian di desktop), metode, tools, hasil utama, tautan, dan catatan metodologi |
| 03 | **More Projects** | Galeri kartu (3 / 2 / 1 kolom) dengan filter kategori opsional; catatan rapi saat daftarnya masih kosong |
| 04 | **Research & Publications** | Daftar bernomor berisi status, jenis, tanggal, penulis, wadah, ringkasan, DOI atau tautan, dan sampul buku |
| 05 | **Achievements & Certificates** | Linimasa prestasi dengan tautan bukti, dan carousel sertifikat |
| 06 | **Contact** | Email sebagai tombol utama, salin satu klik, LinkedIn, GitHub, Instagram |

## Fitur

- **Konten dari file `.txt`**, dimuat saat halaman dibuka dengan `fetch()` dan parser kecil. Tiap bagian punya skeleton saat memuat, pesan galat dengan tombol coba lagi, dan tampilan kosong. Semua teks dimasukkan lewat `textContent`, tidak pernah sebagai HTML.
- **Situs berbahasa Inggris, konten berlapis.** File dasar ada di `content/id/`; `content/en/` berisi teks Inggris yang menimpa kunci yang sama. Kunci yang tidak ada di versi Inggris memakai file dasar. Ubah `BAHASA_DEFAULT: id` di `manifest.txt` untuk menampilkan teks Indonesia.
- **Filter skill.** Tools yang dipakai di proyek menampilkan angka. Memilih salah satu akan menyaring kedua bagian proyek, menyorot chip tools yang cocok, menampilkan "Showing n of N" dengan tombol reset, dan pesan kosong jika satu bagian tidak punya proyek yang cocok.
- **Filter kategori** di More Projects, dibuat dari nilai `KATEGORI`. Hanya muncul jika proyeknya memakai dua kategori atau lebih.
- **Media proyek:** screenshot besar ditampilkan utuh (tidak dipotong), thumbnail jika proyek punya beberapa gambar, dan lightbox dengan zoom serta navigasi tombol panah. PDF dibuka di tempat.
- **Navigasi:** header lengket yang menjadi solid setelah di-scroll, garis bawah pada bagian yang sedang terlihat, menu HP yang aksesibel (tertutup saat tautan dipilih, Escape, atau klik di luar), dan tombol kembali ke atas.
- **Gerak (moderat):** hero muncul bertahap, animasi muncul saat scroll dengan `IntersectionObserver`, foto profil melayang pelan, kartu sedikit terangkat saat hover, dan cahaya kursor tipis. Semuanya berhenti jika perangkat meminta gerak dikurangi, dan konten tidak pernah tersembunyi meski observer tidak tersedia atau gagal.
- **SEO dan pratinjau tautan:** deskripsi, URL kanonik, kartu Open Graph dan Twitter dengan `assets/social/og-image.png`, data terstruktur `Person`, dan favicon SVG.
- **Aksesibilitas:** landmark semantik, satu `h1`, `<dialog>` bawaan dengan fokus kembali ke tombol asal, skip link, cincin fokus terlihat, target sentuh 44 px, `aria-pressed` pada filter, dan carousel yang bisa dioperasikan dengan keyboard (tombol panah, tanpa autoplay).

## Teknologi

| Bagian | Pilihan |
|---|---|
| Markup | HTML5 semantik |
| Gaya | CSS custom properties, Grid, Flexbox |
| Skrip | JavaScript murni (ES modules), tanpa dependensi |
| Huruf | [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), di-host sendiri (SIL OFL 1.1) |
| Hosting | GitHub Pages |

## Struktur proyek

```
.
├── index.html
├── css/styles.css          # token desain + semua komponen
├── js/
│   ├── content.js          # parser .txt dan pemuat konten
│   └── main.js             # render, filter, dialog, lightbox, carousel, gerak
├── content/
│   ├── manifest.txt        # proyek dan publikasi yang tampil, beserta urutannya
│   ├── id/                 # teks Indonesia (utama, lengkap)
│   │   ├── profile.txt  about.txt  education.txt  achievements.txt
│   │   ├── tools.txt  certificates.txt  contact.txt  ui.txt
│   │   ├── projects/       # proyek unggulan, satu file per proyek
│   │   ├── more-projects/  # proyek kecil (lihat _template.txt)
│   │   └── publications/   # satu file per publikasi (lihat _template.txt)
│   └── en/                 # terjemahan Inggris (hanya kunci yang diterjemahkan)
└── assets/
    ├── personal/  projects/<slug>/  publications/  certificates/  documents/
    ├── contact/   tools/   fonts/   social/
```

## Menjalankan secara lokal

Website memuat teksnya dengan `fetch()`, yang diblokir browser jika halaman dibuka langsung dari disk (`file://`). Jalankan lewat server lokal:

```bash
# Cara 1: VS Code
#   Pasang ekstensi "Live Server", klik kanan index.html, pilih "Open with Live Server".

# Cara 2: Python
python -m http.server 8000
# lalu buka http://localhost:8000
```

## Mengubah konten

File konten memakai format `KUNCI: nilai`:

```text
# Baris yang diawali # adalah komentar
JUDUL: Nilai satu baris
RINGKASAN: Nilai panjang boleh berlanjut
ke baris berikutnya.

Baris kosong memulai paragraf baru.
HASIL:
- poin pertama
- poin kedua
TOOLS: R, Python, Excel
---
JUDUL: Entri berikutnya (entri dipisahkan dengan ---)
```

- Kunci ditulis huruf besar di awal baris.
- Nilai kosong (misalnya `LINK_DEMO:`) menyembunyikan tombol atau blok itu. Tidak ada tombol mati yang ditampilkan.
- Nama di `TOOLS:` pada file proyek harus sama dengan `NAMA:` di `tools.txt` agar filter skill bekerja.
- Teks antarmuka (tombol, judul, pesan) ada di `ui.txt`, baik di `content/id/` maupun `content/en/`.

### Teks hero

`content/id/profile.txt` (dan `content/en/profile.txt` untuk bahasa Inggris) punya tiga kunci opsional: `EYEBROW` (teks kecil di atas nama), `HEADLINE` (kalimat posisi), dan `INTRO` (satu paragraf pendek).

### Kelompok skill

Setiap tool di `content/id/tools.txt` punya nilai `GRUP:`: `komputasi`, `perangkat-statistik`, `analitik`, `pengembangan`, atau `produktivitas`. Tool tanpa `GRUP` masuk ke "Other Tools". Nama kelompok ada di `ui.txt` (`SKILL_GROUP_...`).

### Menambah proyek unggulan

1. Salin salah satu file di `content/id/projects/` lalu ganti namanya, misalnya `proyek-baru.txt`.
2. Taruh screenshot di `assets/projects/proyek-baru/` (16:10, sekitar 1600×1000 px). Tulis di bawah `GAMBAR:`; gambar pertama jadi gambar utama, sisanya jadi thumbnail.
3. Tambahkan `- proyek-baru` di bawah `PROYEK:` pada `content/manifest.txt`. Urutan di sana sama dengan urutan di halaman, dan sisi gambar bergantian otomatis.
4. Buat `content/en/projects/proyek-baru.txt` berisi teks Inggris untuk kunci yang tampil di website.

Kunci opsional: `TUJUAN`, `TEKNIK`, `HASIL` (dua poin pertama tampil di halaman, semuanya di catatan metodologi), `KONTRIBUSI`, `LINK_DEMO`, `LABEL_DEMO`, `LINK_REPO`.

### Menambah proyek kecil

1. Salin `content/id/more-projects/_template.txt` ke file baru, misalnya `analisis-saya.txt`, lalu isi.
2. Opsional: taruh screenshot di `assets/projects/analisis-saya/` dan tulis di bawah `GAMBAR:` (atau `THUMBNAIL:`).
3. Tambahkan `- analisis-saya` di bawah `PROYEK_LAINNYA:` pada `content/manifest.txt`.

`KATEGORI` (misalnya `Dashboard` atau `Riset`) dipakai untuk filter kategori, yang muncul begitu ada minimal dua kategori. Selama `PROYEK_LAINNYA:` kosong, bagian ini menampilkan catatan singkat bahwa proyek lain sedang disiapkan.

### Menambah publikasi

Salin `content/id/publications/_template.txt`, isi, lalu tulis nama filenya di bawah `PUBLIKASI:` pada `content/manifest.txt`. `STATUS: proses` menampilkan "In progress"; nilai lain menampilkan "Published".

### Foto, CV, dan sertifikat

| Item | Lokasi | Lalu isi |
|---|---|---|
| Foto profil (latar transparan, persegi, minimal 720 px) | `assets/personal/` | `FOTO:` di `content/id/profile.txt` |
| CV (PDF) | `assets/documents/` | `CV:` di `content/id/profile.txt`; tombol Download CV lalu menggantikan Contact me di hero |
| Gambar / PDF sertifikat | `assets/certificates/` | `GAMBAR:`, `PDF:`, `LINK:` di `content/id/certificates.txt` |
| Pratinjau tautan (1200×630) | `assets/social/og-image.png` | Dipanggil di `index.html` |

## Deploy

Website diterbitkan lewat GitHub Pages dari root branch `main` (**Settings → Pages → Deploy from a branch**). Setiap push ke `main` memperbarui [febrianggi.github.io](https://febrianggi.github.io) dalam satu sampai dua menit. Tidak ada yang perlu di-build.

## Kredit

- Bingkai foto profil berlapis terinspirasi dari portofolio **Humaira Zeanova**.
- Ikon tools dan kontak dipakai ulang dari portofolio referensi yang menjadi dasar website ini.
- Plus Jakarta Sans © The Plus Jakarta Sans Project Authors, berlisensi SIL Open Font License 1.1.

## Kontak

- Email: [febrianggicaesarimmanuel@gmail.com](mailto:febrianggicaesarimmanuel@gmail.com)
- LinkedIn: [in/febrianggi](https://www.linkedin.com/in/febrianggi/)
- GitHub: [Febrianggi](https://github.com/Febrianggi)
- Instagram: [@febri.immanuel_](https://www.instagram.com/febri.immanuel_/)

---

<div align="center">© 2026 Febrianggi Caesar Immanuel</div>
