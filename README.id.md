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

Portofolio pribadi dua bahasa (Indonesia / Inggris) yang dibangun dengan HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa proses build. Semua teks tentang diriku disimpan di file `.txt` biasa di folder `content/`, sehingga isi website bisa diperbarui tanpa menyentuh kode.

## Bagian website

| Bagian | Isi |
|---|---|
| **Tentang** | Judul halaman, Tentang Saya, Pendidikan, Technical Skills, Prestasi, foto profil dan tautan |
| **Proyek Unggulan** | Proyek utama dengan grid screenshot 2×2, metode, tools, dan dialog catatan metodologi |
| **Proyek Lainnya** | Kartu ringkas untuk proyek yang lebih kecil |
| **Publikasi** | Artikel jurnal dan buku, lengkap dengan status (terbit / dalam proses) |
| **Sertifikat** | Carousel 3D dengan pratinjau gambar atau PDF |
| **Kontak** | Email (salin sekali klik), LinkedIn, GitHub, Instagram |

## Fitur

- **Konten di file `.txt`**, dimuat saat halaman dibuka dengan `fetch()` dan parser kecil. Setiap bagian punya skeleton saat memuat, pesan error dengan tombol coba lagi, dan tampilan saat kosong.
- **Pilihan Bahasa Indonesia / Inggris.** File Inggris cukup berisi kunci yang diterjemahkan; sisanya otomatis diambil dari versi Indonesia. Pilihan pengunjung diingat browser.
- **Filter berdasarkan skill.** Memilih ikon di Technical Skills hanya menampilkan proyek yang memakai tool tersebut.
- **Lightbox** untuk screenshot, sampul buku, dan sertifikat, dengan zoom dan navigasi keyboard. PDF bisa dipratinjau langsung.
- **Cahaya kursor** biru yang mengikuti mouse memakai `requestAnimationFrame` dan interpolasi linear. Otomatis mati di layar sentuh dan saat pengguna meminta gerakan dikurangi.
- **Aksesibilitas:** HTML semantik, `<dialog>` bawaan browser, fokus keyboard yang terlihat, skip link, area sentuh minimal 44 px, dan kontras sesuai WCAG AA.

## Teknologi

| Area | Pilihan |
|---|---|
| Markup | HTML5 semantik |
| Gaya | CSS custom properties, Grid, Flexbox, `backdrop-filter` |
| Skrip | JavaScript murni (ES modules) |
| Tipografi | [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), di-host sendiri (SIL OFL 1.1) |
| Hosting | GitHub Pages |

## Struktur folder

```
.
├── index.html
├── css/styles.css
├── js/
│   ├── content.js          # parser .txt dan pemuat dua bahasa
│   └── main.js             # render, filter, dialog, lightbox, carousel
├── content/
│   ├── manifest.txt        # proyek dan publikasi yang tampil, beserta urutannya
│   ├── id/                 # teks Bahasa Indonesia (utama, lengkap)
│   │   ├── profile.txt  about.txt  education.txt  achievements.txt
│   │   ├── tools.txt  certificates.txt  contact.txt  ui.txt
│   │   ├── projects/       # proyek unggulan, satu file per proyek
│   │   ├── more-projects/  # proyek lainnya (lihat _template.txt)
│   │   └── publications/   # satu file per publikasi (lihat _template.txt)
│   └── en/                 # terjemahan Inggris (hanya kunci yang diterjemahkan)
└── assets/
    ├── personal/  projects/<slug>/  publications/  certificates/  documents/
    ├── contact/   tools/   fonts/
```

## Menjalankan di komputer

Website memuat teksnya dengan `fetch()`, yang diblokir browser jika halaman dibuka langsung dari file (`file://`). Jalankan lewat server lokal:

```bash
# Cara 1: VS Code
#   Pasang ekstensi "Live Server", klik kanan index.html, pilih "Open with Live Server".

# Cara 2: Python
python -m http.server 8000
# lalu buka http://localhost:8000
```

## Mengedit konten

File konten memakai format `KUNCI: nilai`:

```text
# Baris diawali # adalah komentar
JUDUL: Nilai satu baris
RINGKASAN: Nilai panjang boleh
menyambung ke baris berikutnya.

Baris kosong membuat paragraf baru.
HASIL:
- poin pertama
- poin kedua
TOOLS: R, Python, Excel
---
JUDUL: Entri berikutnya (entri dipisah ---)
```

- Kunci ditulis huruf besar di awal baris.
- Nilai kosong (misalnya `LINK_DEMO:`) menyembunyikan tombol atau bagian tersebut.
- Nama di `TOOLS:` proyek harus sama dengan `NAMA:` di `tools.txt` agar filter skill bekerja.

### Menambah proyek unggulan

1. Salin salah satu file di `content/id/projects/` dan ganti namanya, misalnya `proyek-baru.txt`.
2. Taruh maksimal empat screenshot di `assets/projects/proyek-baru/` (16:10, sekitar 1600×1000 px).
3. Tambahkan `- proyek-baru` di bawah `PROYEK:` pada `content/manifest.txt`.
4. Opsional: buat `content/en/projects/proyek-baru.txt` berisi kunci yang diterjemahkan.

### Menambah proyek lainnya atau publikasi

Salin `_template.txt` di `content/id/more-projects/` atau `content/id/publications/`, isi, lalu tulis nama file barunya di bawah `PROYEK_LAINNYA:` atau `PUBLIKASI:` pada `content/manifest.txt`.

### Foto, CV, dan sertifikat

| Item | Lokasi | Lalu isi |
|---|---|---|
| Foto profil (persegi atau 4:5, minimal 800 px) | `assets/personal/` | `FOTO:` di `content/id/profile.txt` |
| CV (PDF) | `assets/documents/` | `CV:` di `content/id/profile.txt` |
| Gambar / PDF sertifikat | `assets/certificates/` | `GAMBAR:`, `PDF:`, `LINK:` di `content/id/certificates.txt` |

## Deployment

Website dipublikasikan lewat GitHub Pages dari root branch `main` (**Settings → Pages → Deploy from a branch**). Setiap push ke `main` memperbarui [febrianggi.github.io](https://febrianggi.github.io) dalam satu sampai dua menit.

## Kredit

- Tata letak dan urutan bagian mengikuti portofolio **Humaira Zeanova**.
- Ikon tools dan kontak diambil dari portofolio referensi yang menjadi dasar website ini.
- Plus Jakarta Sans © The Plus Jakarta Sans Project Authors, berlisensi SIL Open Font License 1.1.

## Kontak

- Email: [febrianggicaesarimmanuel@gmail.com](mailto:febrianggicaesarimmanuel@gmail.com)
- LinkedIn: [in/febrianggi](https://www.linkedin.com/in/febrianggi/)
- GitHub: [Febrianggi](https://github.com/Febrianggi)
- Instagram: [@febri.immanuel_](https://www.instagram.com/febri.immanuel_/)

---

<div align="center">© 2026 Febrianggi Caesar Immanuel</div>
