# Spesifikasi Teknis: Aplikasi Sourcing Komponen Elektrik Pabrik (4 Line)

> Dokumen ini adalah brief/prompt lengkap untuk diberikan ke AI coding agent. Semua keputusan di sini adalah hasil diskusi dengan pemilik proyek dan sudah disetujui.

---

## 1. Latar Belakang & Tujuan

Tim (1 admin + 4 anak magang) sedang melakukan survei/sourcing komponen elektrik di mesin-mesin pabrik yang tersebar di 4 Line produksi. Data sebelumnya dikelola lewat spreadsheet online, namun koneksi internet di lokasi pabrik tidak stabil (bahkan sering tidak ada sama sekali), menyebabkan data yang sedang diinput sering hilang saat koneksi terputus.

**Tujuan aplikasi:** alat bantu sourcing berbasis web yang tetap bisa dipakai penuh secara offline, dengan sinkronisasi otomatis ke server pusat begitu koneksi tersedia, sehingga admin bisa memantau progres secara real-time tanpa proses gabung-data manual.

**Catatan penting soal ruang lingkup:** aplikasi ini HANYA alat bantu sourcing/pendataan lapangan. Hasil akhirnya tetap perlu di-export ke Excel (13 kolom, per Line jadi 4 sheet) untuk diserahkan ke manager, karena ada 4 kolom yang memang diisi oleh pihak lain di luar alur kerja anak magang.

---

## 2. Arsitektur Sistem

**Pendekatan: Offline-first (hybrid), bukan cloud-only maupun local-only murni.**

```
[Anak magang isi/edit data di grid]
        |
        v
[Tersimpan otomatis ke IndexedDB (local storage browser)] <-- selalu terjadi duluan, tidak peduli online/offline
        |
        v
   Ada koneksi? --Tidak--> [Data tetap aman di device, dicoba sync lagi otomatis nanti]
        | Ya
        v
[Sync otomatis ke Firestore (server pusat)]
        |
        v
[Admin & dashboard publik melihat data real-time dari server pusat]
```

### Stack yang direkomendasikan
| Komponen | Teknologi | Alasan |
|---|---|---|
| Frontend | Web app (PWA - installable ke homescreen HP/desktop) | Bisa dipakai di HP & laptop, offline app-shell |
| Local storage | IndexedDB (native browser), atau Firestore offline persistence (built-in) | Data tidak hilang saat koneksi putus |
| Backend/Database | **Firebase** — Firestore (database) + Firebase Auth (login). **Firebase Storage TIDAK dipakai** (lihat bagian 4, kolom Foto hanya menyimpan teks link Gdrive, bukan file) | Firestore punya offline-write + auto-sync bawaan, cocok persis untuk kasus internet tidak stabil ini; setup cepat, gratis untuk skala tim kecil ini; tanpa Storage jadi lebih sederhana & lebih hemat |
| Export/Import Excel | Library SheetJS (xlsx), dijalankan di sisi client | Ringan, hasil rapi, bisa jalan tanpa tergantung server |

### Batasan yang perlu disadari
- Fitur ini butuh koneksi internet SAAT PERTAMA KALI login/setup, dan saat proses sync. Setelah itu, pengisian data 100% bisa offline.
- Firebase adalah layanan pihak ketiga (Google) — ini sudah disetujui pemilik proyek demi kecepatan & keandalan solusi offline-sync bawaan.

---

## 3. Role & Hak Akses

| Role | Login? | Hak Akses |
|---|---|---|
| **Admin** (pemilik proyek) | Ya | Full CRUD ke semua data, semua Line. Kelola akun anak magang. Atur konfigurasi kolom (lihat bagian 6). Export/import Excel. Restore data dari recycle bin. Lihat log aktivitas. |
| **Anak Magang** (4 akun, 1 akun = 1 Line) | Ya | CRUD (tambah/edit/hapus, termasuk bulk) HANYA pada data Line yang menjadi tanggung jawabnya. Tidak bisa mengedit 4 kolom "milik pihak lain" (lihat bagian 6). Tidak bisa akses Line lain. |
| **Publik** (internal perusahaan, tanpa login) | Tidak | Read-only. Melihat checklist progress per lokasi & diagram pencapaian. TIDAK melihat data mentah/detail part per baris — hanya ringkasan/agregat. Tidak bisa mencentang/mengedit apapun. |

**Keamanan wajib diterapkan di level Firestore Security Rules (server-side), bukan hanya disembunyikan di UI**, supaya role publik/intern tidak bisa mengakses data di luar haknya walau mencoba lewat cara teknis.

---

## 4. Struktur Data

### Hierarki navigasi
```
Line (1-4)
  └── Location (tab di dalam Line)
        └── Baris data komponen (grid, per baris = 1 dokumen Firestore)
```
Kolom `Plant` dan `Location` TIDAK ditampilkan lagi sebagai kolom di dalam grid baris — keduanya menjadi konteks navigasi (dipilih dulu via Line & tab Location sebelum melihat grid).

### 13 Kolom Final (nama baku, sudah disepakati)
1. Plant *(konteks navigasi, bukan kolom di grid)*
2. Location *(konteks navigasi via tab, bukan kolom di grid)*
3. Sub-Machine
4. Item Code
5. Category
6. Part
7. Description ( Bella )
8. Spesification
9. Warehouse Name
10. Status *(nilai: "Existing" / "Tidak Aktif")*
11. Qty
12. Foto — **berisi teks/URL link Google Drive, BUKAN file foto asli** yang diupload ke sistem. Ditampilkan sebagai link yang bisa diklik (buka tab baru ke Gdrive), dengan **preview popup** saat hover (desktop) atau tap sekali (mobile) yang menampilkan gambar dari link tersebut secara langsung. Syarat: file Gdrive harus di-share dengan akses "Siapa saja yang punya link bisa lihat" agar preview bisa tampil.
13. Qty WH

> **PR untuk pemilik proyek (di luar scope AI agent):** menyamakan nama & jumlah kolom (fix 13 kolom) di seluruh sheet spreadsheet sumber sebelum data lama di-import.

### Kepemilikan pengisian kolom
- **Diisi oleh Anak Magang** (7 kolom, dasar syarat "selesai"): Sub-Machine, Category, Part, Spesification, Status, Qty, Foto
- **Ditampilkan tapi TIDAK diisi anak magang** (diisi manager/admin di luar/sesudah proses ini): Item Code, Description ( Bella ), Warehouse Name, Qty WH

### Field tambahan per dokumen (metadata, bukan kolom Excel)
- `line`, `locationId`
- `status_completeness` (computed: lengkap / belum)
- `createdBy`, `lastEditedBy`, `lastUpdated` (untuk log aktivitas)
- `isDeleted`, `deletedAt` (untuk recycle bin, soft-delete)

---

## 5. Aturan Bisnis: "Selesai / Lengkap"

Sebuah **baris** dianggap **lengkap/teridentifikasi** jika 7 kolom syarat (Sub-Machine, Category, Part, Spesification, Status, Qty, Foto) sudah terisi.

**Pengecualian penting:** jika `Status = "Tidak Aktif"`, maka kolom **Qty boleh kosong** dan baris tetap dihitung lengkap (karena part tidak aktif secara fisik tidak terlihat/tidak bisa diukur qty-nya).

Sebuah **Location** dianggap **selesai (checklist ✓)** jika SEMUA baris di dalam Location tersebut berstatus lengkap.

**Persentase kelengkapan** dihitung dari total baris data, ditampilkan:
- Per Line
- Gabungan (keseluruhan 4 Line)

Definisi "lengkap" TIDAK peduli apakah Status-nya Existing atau Tidak Aktif — yang penting seluruh kolom syarat terisi (dengan pengecualian Qty di atas).

---

## 6. Konfigurasi oleh Admin (bukan hardcode)

Admin memiliki panel pengaturan untuk mengubah, tanpa perlu ubah kode:
- Kolom mana saja yang termasuk **syarat kelengkapan**
- Kolom mana saja yang **ditampilkan/disembunyikan** di grid

---

## 7. Model Input Data (UX)

- **Model grid/spreadsheet**, bukan form + tombol submit. Anak magang klik sel, ketik, pindah sel → otomatis tersimpan (auto-save, debounced), dengan indikator kecil "tersimpan ✓" per baris/sel agar user yakin datanya aman.
- Auto-save ini menulis ke IndexedDB dulu (selalu), lalu sync ke Firestore saat online.
- Kolom **Foto**: klik sel membuka opsi ambil foto dari kamera (capture) atau pilih dari galeri; foto disimpan lokal dulu, di-upload ke Firebase Storage saat online tersedia.

### Tambah baris
- Tambah 1 baris kosong
- **Bulk add**: generate N baris kosong sekaligus untuk 1 Location
- **Duplikat baris**: menyalin baris yang sudah ada (untuk part yang mirip), tinggal ubah sebagian kolom

### Hapus baris
- Hapus 1 baris maupun **bulk delete** (pilih banyak baris sekaligus)
- **Wajib ada dialog konfirmasi** sebelum hapus, khususnya bulk delete harus menampilkan ringkasan ("Anda akan menghapus X baris dari Location Y")
- **Soft-delete / Recycle Bin — retensi TANPA BATAS WAKTU (bukan auto-purge)**: data yang dihapus hanya diberi tanda `isDeleted` dan disembunyikan dari tampilan normal grid, TIDAK benar-benar dihapus dari database. Admin punya filter "Tampilkan yang sudah dihapus" untuk melihat & merestore kapan pun, tanpa batas waktu (karena volume data kecil, biaya penyimpanan ekstra dapat diabaikan, dan kebutuhan menarik data lama oleh manager bisa muncul kapan saja). Hapus permanen ("Hapus Selamanya") hanya terjadi lewat aksi eksplisit admin, tidak pernah otomatis oleh sistem.

### Log aktivitas
Setiap tambah/edit/hapus dicatat: siapa, apa, kapan (misal: "Andi menghapus 5 baris di Line 2 - Lokasi Boiler, 5 Juli 14:32"). Bisa dilihat admin untuk audit trail.

---

## 8. Import & Export Excel

### Export
- Format & nama kolom mengikuti persis 13 kolom final (lihat bagian 4), dengan styling rapi (header bold, lebar kolom pas) menggunakan library seperti SheetJS.
- Opsi export per-Line (1 file, 1 sheet) DAN **export gabungan** (1 file, 4 sheet — satu per Line), sehingga admin tidak perlu proses gabung manual lagi.
- **Preview hasil sebelum download**, supaya admin bisa memastikan tampilan rapi sebelum dikirim ke manager.

### Import
- Untuk memasukkan data lama dari spreadsheet existing sebagai starting point.
- **Alur wajib:** Upload file → **preview & pemetaan kolom manual** (karena kemungkinan nama kolom sumber masih berbeda-beda) → **validasi otomatis per baris** (tipe data benar, field wajib terisi sesuai aturan bagian 5) → tampilkan laporan error (jika ada) → BARU admin konfirmasi commit ke database. Tidak ada data yang masuk ke database sebelum tahap validasi ini dilewati.
- Setiap sesi import diberi "tanda batch" sehingga bisa di-**undo** sekaligus (misal "Batalkan Import Ini") jika ternyata ada kesalahan.

---

## 9. Dashboard & Diagram Pencapaian

**Akses:** Admin (full) & Publik (read-only, tanpa login, internal perusahaan).

Konten yang ditampilkan:
1. **Ringkasan status part** (dari kolom Status): total jumlah part, % Existing, % Tidak Aktif
2. **Progress kelengkapan data**: persentase baris lengkap/teridentifikasi — gabungan & per Line (ini otomatis juga berfungsi sebagai leaderboard per anak magang, karena 1 Line = 1 orang)
3. **Breakdown per Category komponen** — jumlah part per kategori
4. **Tren progress harian** (line chart) — kecepatan pengerjaan per Line dari waktu ke waktu
5. **Papan checklist per Location** — daftar visual Location mana yang sudah ✓ selesai, mana yang masih berjalan

Publik hanya melihat versi agregat/ringkasan di atas — TIDAK melihat data mentah per baris (Part, Spesifikasi, dll).

---

## 10. Desain & Responsivitas

- Tampilan harus optimal dan nyaman digunakan di **desktop** (grid lega, banyak kolom terlihat) maupun **HP** (responsive — bisa berupa penyesuaian tampilan grid/kolom prioritas atau mode kartu per baris di layar kecil), agar anak magang tidak kebingungan dengan tata letak di lapangan.
- Konteks penggunaan: aplikasi industrial/lapangan pabrik — prioritaskan keterbacaan, target sentuh yang besar (dipakai di HP dengan kondisi tangan mungkin kotor/sarung tangan), dan indikator status koneksi/sinkronisasi yang jelas terlihat.

### Arahan visual konkret (pemilik proyek bukan desainer, tapi punya preferensi jelas)
- **Tipografi**: sans-serif humanis yang mudah dibaca dalam waktu lama, semacam Inter / Source Sans / Public Sans. HINDARI font geometris/techy yang terkesan "robotic" atau nyentrik.
- **Palet warna**: terang dan tidak melelahkan mata, mengadopsi nuansa Google Sheets — dasar putih/abu sangat muda, garis grid tipis, hijau (kisaran #0F9D58/#188038) sebagai warna utama, biru (kisaran #1a73e8) sebagai aksen sekunder, kuning/oranye lembut untuk peringatan, merah untuk status hapus/error.
- **Hindari kesan "AI slop"**: jangan pakai gradient ungu-pink generik, ilustrasi 3D berlebihan, atau elemen dekoratif tanpa fungsi. Fokus ke tampilan bersih, fungsional, dan familiar seperti tools produktivitas (Google Sheets/Excel) yang sudah biasa dipakai tim — bukan gaya landing page startup.

---

## 11. Ringkasan Keputusan (checklist persetujuan)

- [x] Arsitektur: Offline-first hybrid (IndexedDB + Firestore sync)
- [x] Backend: Firebase (Firestore, Auth, Storage)
- [x] 3 role: Admin, Anak Magang (per Line), Publik (read-only, no-login)
- [x] 13 kolom final, Plant & Location jadi navigasi bukan kolom
- [x] Syarat kelengkapan: 7 kolom, dengan pengecualian Qty jika Status = Tidak Aktif
- [x] Checklist per Location, persentase per Line & gabungan
- [x] Kolom konfigurasi (syarat & visibility) diatur admin, bukan hardcode
- [x] Input model: grid/spreadsheet dengan auto-save, bukan form+submit
- [x] Bulk add/delete dengan konfirmasi + recycle bin + log aktivitas
- [x] Import Excel dengan preview, mapping kolom, validasi, dan undo per batch
- [x] Export Excel per-Line dan gabungan (4 sheet), dengan preview & styling rapi
- [x] Dashboard dengan 5 jenis visualisasi (lihat bagian 9)
- [x] Desain desktop-first tapi fully responsive di mobile
- [x] Recycle bin: retensi tanpa batas waktu, purge permanen hanya manual oleh admin
- [x] Kolom Foto: teks link Gdrive saja (bukan file), clickable + preview popup hover/tap; Firebase Storage tidak dipakai
- [x] Arahan desain: tipografi humanis mudah dibaca, palet terang bernuansa Google Sheets, hindari gaya "AI slop"

---

## 12. Perkiraan Skala & Hal Teknis Tambahan

- **Perkiraan volume data**: total baris gabungan saat ini + perkiraan tambahan beberapa ratus baris ke depan — skala ini masih sangat kecil untuk free tier Firestore, tidak perlu Firebase Storage sama sekali (kolom Foto hanya teks link).
- AI Agent tetap perlu konfirmasi ke pemilik proyek soal detail kecil implementasi teknis lain jika muncul selama proses coding (misal batas ukuran query, penamaan project Firebase, dsb).
