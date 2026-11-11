# Portofolio Febrianggi Caesar Immanuel

Situs statis (HTML, CSS, JavaScript murni). Semua teks tentang diriku ada di folder `content/` sebagai file `.txt`, jadi isi website bisa diubah tanpa menyentuh kode.

## Menjalankan di komputer

Website mengambil isi `.txt` dengan `fetch()`. Browser memblokir `fetch()` kalau `index.html` dibuka langsung dengan klik dua kali (alamat `file://`). Karena itu jalankan lewat server lokal:

- **VS Code:** pasang ekstensi *Live Server*, klik kanan `index.html`, pilih **Open with Live Server**.
- **Python:** di folder ini jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`.

Di GitHub Pages semuanya langsung berjalan tanpa pengaturan tambahan.

## Struktur folder

```
index.html
css/styles.css
js/content.js        parser .txt + pemuat dua bahasa
js/main.js           tab, dialog, lightbox, carousel, filter, toast, cursor glow
content/
  manifest.txt       daftar & urutan proyek dan publikasi
  id/                teks Bahasa Indonesia (versi utama, lengkap)
  en/                teks Bahasa Inggris (cukup kunci yang diterjemahkan)
assets/
  personal/          foto profil
  projects/<slug>/   screenshot proyek (1.webp sampai 4.webp)
  publications/      sampul buku
  certificates/      gambar & PDF sertifikat
  documents/         CV
  contact/  tools/  fonts/
```

## Format file .txt

```
# baris diawali pagar = komentar, tidak tampil
JUDUL: Satu baris teks
RINGKASAN: Teks panjang boleh
menyambung ke baris berikutnya.

Baris kosong membuat paragraf baru.
HASIL:
- poin pertama
- poin kedua
TOOLS: R, Python, Excel
---
JUDUL: Entri berikutnya (dipisah tiga tanda minus)
```

- Nama kunci ditulis huruf besar di awal baris, diikuti titik dua.
- Nilai kosong (misalnya `LINK_DEMO:`) membuat tombol atau bagian itu disembunyikan.
- Nama di `TOOLS:` proyek harus sama dengan `NAMA:` di `tools.txt` agar filter bekerja.

## Dua bahasa

`content/id/` adalah sumber utama. File di `content/en/` hanya perlu berisi kunci yang diterjemahkan; kunci yang tidak ditulis otomatis diambil dari versi Indonesia (link, gambar, tahun, dan lainnya). Untuk file berisi banyak entri (`---`), urutan entri di `en/` harus sama dengan di `id/`. Kalau file `en/` tidak ada, website menampilkan versi Indonesia.

Pilihan bahasa pengunjung disimpan di browser. Bahasa awal diatur di `BAHASA_DEFAULT` pada `manifest.txt`.

## Menambah proyek

1. Buat `content/id/projects/nama-proyek.txt` (salin dari proyek lain).
2. Taruh screenshot di `assets/projects/nama-proyek/1.webp` dst. (16:10, sekitar 1600×1000 px, maksimal 4).
3. Tambahkan `- nama-proyek` ke daftar `PROYEK:` di `content/manifest.txt`.
4. Opsional: buat `content/en/projects/nama-proyek.txt` untuk terjemahan.

Publikasi baru: salin `content/id/publications/_template.txt`, lalu daftarkan di `PUBLIKASI:`.

## Yang masih menunggu

| Yang dibutuhkan | Taruh di | Lalu isi |
|---|---|---|
| Foto profil (4:5, min. 800×1000) | `assets/personal/profile.jpg` | `FOTO:` di `content/id/profile.txt` |
| CV (PDF) | `assets/documents/cv-febrianggi.pdf` | `CV:` di `profile.txt` |
| Screenshot GFF Farma | `assets/projects/gff-farma/1.webp`… | `GAMBAR:` di `gff-farma.txt` |
| Gambar & PDF sertifikat | `assets/certificates/` | `GAMBAR:`, `PDF:`, `LINK:` di `certificates.txt` |
| Link repo / demo tiap proyek | | `LINK_REPO:`, `LINK_DEMO:` |
| Tools proyek RASIO | | `TOOLS:` di `rasio-multilevel.txt` |

Cari tulisan `TODO` di folder `content/` untuk melihat semua bagian yang perlu dicek.
