# Progress — Plant Sourcing App

> File ini di-update tiap kali ada progress berarti (fitur baru selesai, atau bug-fix yang mengandung pelajaran penting). Selalu paste isi file ini di awal sesi baru ke AI editor mana pun yang dipakai.

## Status Sekarang
- ✅ Setup project React + Vite + Tailwind + Firebase
- ✅ Firebase Auth aktif (Email/Password), 5 user dibuat (1 admin + 4 intern)
- ✅ Firestore koleksi `users` berisi role + assignedLine per akun
- ✅ Login & Dashboard dasar berhasil, sudah terhubung ke Firebase Auth + Firestore
- ✅ Design system diterapkan ke Login & Dashboard (lihat DESIGN-plant-sourcing.md)
- ✅ Login page di-refactor: duplikat komponen dihapus, design system tokens diterapkan (warna, tipografi, shadow, input, button sesuai DESIGN-plant-sourcing.md), toggle show/hide password ditambahkan
- ✅ Dashboard di-refactor: duplikat komponen dihapus, layout lengkap dengan:
  - Sticky header dengan nama user & role
  - Sync status bar (otomatis deteksi online/offline)
  - Stat cards (Total Part, Existing, Tidak Aktif, Kelengkapan Data)
  - Progress bar keseluruhan (gabungan 4 Line)
  - Progress per Line dengan checklist lokasi (card clickable → navigasi ke /line/lineN)
  - Breakdown per Category (horizontal bar chart, palet warna netral non-semantik)
  - Semua menggunakan data placeholder (akan diganti Firestore queries)
- ✅ CSS design system lengkap di `index.css`: semua token warna, tipografi, spacing, shadow, komponen (btn-primary/secondary/danger, ds-card, ds-input, progress-track/fill, sync-bar, chip-existing/inactive, data-grid, location-tabs, grid-toolbar, save-indicator) sesuai DESIGN-plant-sourcing.md
- ✅ `index.html` duplikat dokumen HTML dihapus, meta description ditambahkan
- ✅ `App.css` dibersihkan dari sisa template Vite (hero, counter, ticks)
- ✅ **Grid data per Line & Location (iterasi 1)** — halaman `/line/:lineId`:
  - Tab horizontal per Location (data dummy, 3-4 lokasi per Line)
  - Grid/tabel 11 kolom sesuai Spesifikasi §4 (tanpa Plant & Location)
  - Inline cell editing: klik cell → edit langsung, Enter/blur → simpan, Escape → batal
  - Kolom Status pakai `<select>` (Existing / Tidak Aktif)
  - Kolom Foto tampil sebagai link biru clickable (buka tab baru)
  - Auto-save ke Firestore koleksi `components`, dengan indikator ✓ fade-out
  - Tombol "+ Tambah Baris" (1 baris kosong baru)
  - Real-time update via `onSnapshot` (data langsung muncul tanpa refresh)
  - Permission check client-side: intern hanya bisa edit Line miliknya sendiri,
    Line lain ditampilkan read-only dengan banner peringatan
  - Error handling untuk permission-denied dari Firestore Security Rules
- ⬜ Belum: bulk add/delete, duplikat baris, recycle bin, log aktivitas
- ⬜ Belum: export/import Excel
- ⬜ Belum: dashboard chart & checklist publik (data masih placeholder)
- ⬜ Belum: PWA/offline persistence penuh (baru enableIndexedDbPersistence di firebase.js)
- ⬜ Belum: menghubungkan dashboard ke data Firestore real (saat ini placeholder)
- ⬜ Belum: hover-preview popup untuk kolom Foto (link Google Drive)

## Keputusan Penting (jangan diubah tanpa alasan kuat & sepengetahuan admin project)
- Kolom **Foto** = teks link Google Drive, BUKAN file upload. Tidak pakai Firebase Storage.
- Nama koleksi Firestore harus **`users`** (huruf kecil semua) — Firestore case-sensitive.
- 13 kolom final: Plant, Location, Sub-Machine, Item Code, Category, Part,
  Description ( Bella ), Spesification, Warehouse Name, Status, Qty, Foto, Qty WH.
  Plant & Location TIDAK ditampilkan sebagai kolom di grid — jadi konteks navigasi
  (pilih Line lalu tab Location).
- Syarat "baris selesai": 7 kolom (Sub-Machine, Category, Part, Spesification, Status,
  Qty, Foto) harus terisi. **Pengecualian**: kalau Status = "Tidak Aktif", Qty boleh kosong.
- 3 role: admin (full akses), intern (akses terbatas ke line miliknya saja, ditentukan
  field `assignedLine` di dokumen user), publik (read-only, tanpa login, cuma lihat
  ringkasan/checklist, bukan data mentah).
- Recycle bin: retensi TANPA batas waktu, hapus permanen hanya manual oleh admin.
- Model input: grid/spreadsheet dengan cell editable inline + autosave. BUKAN form+submit.
- Design system mengacu **DESIGN-plant-sourcing.md** — utilitarian, spreadsheet-inspired,
  warna hanya untuk semantik (hijau=success, biru=info/link, kuning=warning, merah=danger).
  Tidak pakai gradient dekoratif, dark mode, atau elemen visual tanpa fungsi.
- Label role di UI: "Admin" dan "Internship" (bahasa Inggris, keputusan gaya
  dari admin project) — bukan "Anak Magang".

## Log Bug/Isu yang Pernah Ditemukan (biar tidak terulang)
- **Heading nyaris tak terlihat**: disebabkan sisa CSS bawaan template Vite (dark-mode
  variables) yang belum dihapus, bentrok dengan background Tailwind. → Sudah dihapus.
- **Role tampil kosong (`-`)**: disebabkan nama koleksi Firestore salah huruf besar/kecil
  (`Users` vs `users`). → Sudah diperbaiki, dokumen dipindah ke koleksi `users`.
- **Login terasa lambat**: bukan masalah koneksi, tapi tidak ada loading indicator saat
  AuthContext menunggu proses `getDoc` ke Firestore. → Sudah ditangani (AuthProvider
  menunggu `loading` selesai sebelum render children).
- **Duplikat kode di Login.jsx & Dashboard.jsx**: kedua file berisi komponen yang sama
  persis tertulis 2× — penyebabnya kemungkinan copy-paste yang tidak disadari.
  → Sudah dibersihkan, sekarang masing-masing file hanya berisi 1 komponen.
- **Duplikat HTML di index.html**: file berisi 2 dokumen `<!doctype html>` sekaligus.
  → Sudah dibersihkan, sekarang hanya 1 dokumen valid.
- **Sisa CSS template Vite di App.css & index.css**: dark-mode variables, sizing #root
  yang aneh (width 1126px, border, dll), hero/counter/ticks styles — semuanya tidak
  relevan dan bentrok dengan design system. → Sudah dihapus total, diganti dengan
  design system tokens yang sesuai DESIGN-plant-sourcing.md.
- **Role label di header menampilkan "User" generik**: akar masalah BUKAN di logic
  mapping role di React (roleLabelMap dan AuthContext sudah benar). Penyebab sebenarnya
  adalah **Firestore Security Rules masih dalam production mode default yang menolak
  semua read/write**. `getDoc()` gagal → catch block set `userRole = null` → fallback
  "User" ditampilkan. → Sudah diperbaiki manual di Firebase Console (rules diubah agar
  user terautentikasi bisa membaca dokumen profil sendiri di koleksi `users`).
- **Warna chart kategori melanggar semantik design system**: chart "Breakdown per
  Category" memakai hijau/amber/merah yang direservasi untuk status. → Sudah diganti
  dengan palet netral (biru/violet/teal/indigo) di `CATEGORY_COLORS`.

## Catatan Review (perlu ditindaklanjuti sebelum lanjut fitur berikutnya)
- ✅ ~~Warna chart "Breakdown per Category"~~ — sudah diganti palet netral
  (biru/violet/teal/indigo), tidak lagi memakai warna semantik status.
- ✅ ~~Label role di header~~ — akar masalah: Firestore Security Rules (bukan kode React).
  Sudah diperbaiki di Firebase Console.
- ✅ ~~Dashboard intern menampilkan semua Line~~ — diputuskan: tetap tampilkan gabungan
  semua 4 Line (fungsi leaderboard per spesifikasi §9, data yang ditampilkan hanya
  agregat). Ditambahkan highlight visual (border biru + badge "Line Kamu") pada card
  Line milik intern yang login, agar mereka langsung tahu mana Line-nya.

## File Acuan (selalu sertakan saat mulai sesi baru dengan AI editor)
- `Spesifikasi_App_Plant_Sourcing.md` — spesifikasi fitur & arsitektur lengkap
- `DESIGN-plant-sourcing.md` — design system (warna, tipografi, komponen grid, dll)
- `PROGRESS.md` — file ini