# Checklist Testing Manual — Plant Sourcing App

> Dokumen ini untuk dijalankan manual tiap kali ada perubahan besar di kode (fitur baru, refactor, migrasi library, dll), supaya tidak ada regresi yang kelewat. Tidak perlu dijalankan SEMUA tiap kali — pilih bagian yang relevan dengan perubahan yang baru dibuat. Centang [ ] jadi [x] kalau lolos, catat di kolom "Catatan" kalau ada yang aneh.

**Cara pakai**: siapkan minimal 2 browser/tab berbeda kalau mau testing multi-role sekaligus (misal 1 tab admin, 1 tab intern) supaya tidak perlu logout-login bolak-balik.

---

## 1. Auth & Role

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 1.1 | Login sebagai admin | Masuk ke Dashboard, tombol admin (gear, Recycle Bin, Activity Log, Import/Export) semua muncul | [ ] |
| 1.2 | Login sebagai intern | Masuk ke Dashboard, tombol admin TIDAK ada satupun | [ ] |
| 1.3 | Intern akses `/admin/settings` langsung via URL | Redirect ke Dashboard | [ ] |
| 1.4 | Intern akses `/admin/recycle-bin` langsung via URL | Redirect ke Dashboard | [ ] |
| 1.5 | Intern akses `/admin/activity-log` langsung via URL | Redirect ke Dashboard | [ ] |
| 1.6 | Intern akses `/admin/import` atau `/admin/export` langsung via URL | Redirect ke Dashboard | [ ] |
| 1.7 | Buka `/` (Dashboard) tanpa login sama sekali (mode Incognito) | Halaman tidak crash, 4 bagian data (Ringkasan Status, Progress Kelengkapan, Breakdown Category, Checklist Location) tetap tampil, tombol "Keluar" berubah jadi "Login" | [ ] |
| 1.8 | Intern Line 2 buka `/line/line4` (Line milik orang lain) via URL | Tidak bisa edit apapun (tombol/cell disabled atau ditolak rules) | [ ] |

---

## 2. Grid Data — CRUD Dasar

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 2.1 | Tambah 1 baris kosong | Baris baru muncul di grid, tersimpan otomatis | [ ] |
| 2.2 | Edit 1 cell teks (mis. Sub-Machine) | Auto-save, indikator "tersimpan ✓" muncul | [ ] |
| 2.3 | Edit cell Qty/Qty WH (number) | Cuma bisa angka, stepper muncul | [ ] |
| 2.4 | Edit cell Status (dropdown select) | Pilihan "Existing"/"Tidak Aktif" muncul, tersimpan benar | [ ] |
| 2.5 | Edit cell Category | Muncul dropdown saran (datalist) dari kategori yang sudah pernah dipakai, TAPI tetap bisa ketik bebas kategori baru | [ ] |
| 2.6 | Ketik kategori BARU yang belum ada di saran | Tetap tersimpan, dan otomatis masuk ke daftar saran untuk device lain (cek di Line lain / refresh) | [ ] |
| 2.7 | Edit cell Foto, isi link Google Drive | Tersimpan sebagai teks, muncul sebagai link biru | [ ] |
| 2.8 | Hover/tap link Foto yang sudah ada isinya | Muncul preview gambar popup | [ ] |
| 2.9 | Duplikat 1 baris | Baris baru muncul dengan isi sama persis (kecuali id/timestamp) | [ ] |
| 2.10 | Hapus 1 baris (soft-delete) | Baris hilang dari grid, TIDAK hilang permanen dari database | [ ] |
| 2.11 | Bulk: centang 3-5 baris, hapus sekaligus | Muncul dialog konfirmasi menyebutkan jumlah baris, setelah konfirmasi semua hilang dari grid | [ ] |
| 2.12 | Bulk Add: generate 5 baris kosong sekaligus | 5 baris baru muncul di Location aktif | [ ] |

---

## 3. Fitur Produktivitas Grid

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 3.1 | Klik ikon filter di header kolom apapun, pilih 1-2 nilai | Grid cuma tampilkan baris yang cocok | [ ] |
| 3.2 | Flag baris "Perlu Ditanyakan"/"Dilewati" | Ikon flag berubah, tersimpan | [ ] |
| 3.3 | Isi Kolom Massal: centang beberapa baris, isi 1 kolom sekaligus | Semua baris terpilih ter-update dengan nilai yang sama | [ ] |
| 3.4 | Cari & Ganti: cari teks, preview hasil sebelum ganti | Preview menampilkan baris yang akan terpengaruh dengan benar | [ ] |
| 3.5 | Cari & Ganti: eksekusi ganti pada kolom Category (mis. "breaker" → "Breaker") | Semua baris yang match ter-update | [ ] |

---

## 4. Lokasi (Location)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 4.1 | Tambah Location baru dengan nama unik | Tab baru muncul, bisa langsung diisi data | [ ] |
| 4.2 | Tambah Location dengan nama yang SUDAH ADA di Line yang sama | Toast error jelas ("Lokasi sudah ada"), TIDAK bikin duplikat | [ ] |
| 4.3 | Tambah Location dengan nama yang sudah dipakai Line LAIN (mis. "Motor Room" juga ada di Line 1) | Berhasil dibuat sebagai lokasi terpisah untuk Line ini, TIDAK menimpa/merusak lokasi Line lain | [ ] |
| 4.4 | Cek ID dokumen Location baru di Firebase Console | Format `${lineId}__${slug}` (mis. `line4__motor-room`) | [ ] |

---

## 5. Offline-First (PALING PENTING — inti aplikasi ini)

> Gunakan DevTools → Network tab → ubah ke "Offline" untuk simulasi terkontrol (lebih reliable daripada cabut WiFi).

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 5.1 | Offline, edit beberapa cell | Tetap bisa diketik & tersimpan ke cache lokal, indikator status berubah jadi "Offline" | [ ] |
| 5.2 | Offline, tambah baris baru | Baris baru langsung muncul di grid (dari cache lokal) | [ ] |
| 5.3 | Offline, tambah Location baru | Tab baru langsung muncul, TIDAK ada modal yang "nyangkut"/macet | [ ] |
| 5.4 | Balik online setelah langkah 5.1-5.3 | Semua perubahan tersinkron ke server tanpa hilang, indikator balik ke "Online" | [ ] |
| 5.5 | Offline, buka 2 tab/window (multi-tab) | Kedua tab tetap bisa dipakai, sinkron begitu salah satu online | [ ] |
| 5.6 | Refresh browser saat offline (sudah pernah buka sebelumnya) | Data yang sudah pernah di-load tetap muncul dari cache, tidak blank | [ ] |

---

## 6. Panel Konfigurasi Admin (`/admin/settings`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 6.1 | Admin ubah 1 kolom jadi "tidak wajib" (keluarkan dari syarat kelengkapan) | Tersimpan, toast sukses | [ ] |
| 6.2 | Buka `/line/:lineId` di tab lain TANPA refresh | Baris yang cuma kosong kolom itu langsung berubah jadi "lengkap" (real-time) | [ ] |
| 6.3 | Buka Dashboard (admin maupun publik/incognito) setelah langkah 6.1 | Persentase "Progress Kelengkapan" ikut berubah sesuai config baru, real-time | [ ] |
| 6.4 | Sembunyikan 1 kolom (hiddenColumns) | Kolom hilang dari grid, header, Cari & Ganti, dan Isi Massal | [ ] |
| 6.5 | Refresh browser setelah ubah setting | Setting tetap tersimpan (tidak balik ke default) | [ ] |

---

## 7. Recycle Bin (`/admin/recycle-bin`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 7.1 | Buka halaman, cek baris yang dihapus dari grid muncul di sini | Tabel menampilkan Line/Location/Sub-Machine/Part/Dihapus Oleh/Waktu Hapus dengan benar | [ ] |
| 7.2 | Klik "Pulihkan" 1 baris | Baris hilang dari Recycle Bin, muncul lagi di grid asalnya | [ ] |
| 7.3 | Search bar: ketik nama Sub-Machine/Part | Tabel ter-filter sesuai kata kunci | [ ] |
| 7.4 | Filter dropdown Line & User | Tabel ter-filter sesuai pilihan, bisa dikombinasi dengan search | [ ] |
| 7.5 | Bulk: centang beberapa baris, "Pulihkan Terpilih" | Semua baris terpilih pulih sekaligus | [ ] |
| 7.6 | Bulk/single: "Hapus Selamanya" | Muncul dialog konfirmasi tegas (permanen, tidak bisa di-undo), setelah konfirmasi baris hilang total dari Firebase Console (bukan cuma isDeleted) | [ ] |
| 7.7 | Sebagai intern, coba `deleteDoc` langsung lewat DevTools Console ke baris Line sendiri | Ditolak `permission-denied` (cuma admin yang boleh hapus permanen) | [ ] |

---

## 8. Log Aktivitas (`/admin/activity-log`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 8.1 | Lakukan aksi besar (tambah baris, hapus, tambah lokasi, dst) di grid | Muncul entry baru di Activity Log dengan label Bahasa Indonesia yang jelas | [ ] |
| 8.2 | Pulihkan/hapus permanen di Recycle Bin | Ikut tercatat di Activity Log | [ ] |
| 8.3 | Filter dropdown Line & Aksi | Tabel ter-filter dengan benar | [ ] |
| 8.4 | Cek kolom "Detail" | Menampilkan info kontekstual (Line/Location/jumlah baris) sesuai jenis aksi | [ ] |

---

## 9. Import Excel (`/admin/import`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 9.1 | Upload file .xlsx dengan 4 sheet (1 sheet = 1 Line) | Preview mentah muncul, deteksi/pemetaan sheet ke Line benar | [ ] |
| 9.2 | Cek mapping kolom otomatis | Nama kolom Excel ter-mapping ke 13 kolom final dengan benar | [ ] |
| 9.3 | Sengaja bikin 1 baris data tidak valid (mis. Status bukan "Existing"/"Tidak Aktif") | Muncul di laporan error, TIDAK ikut ter-commit sebelum diperbaiki/diabaikan | [ ] |
| 9.4 | Konfirmasi commit import | Data lama (components + locations, KECUALI users) terhapus permanen, data baru masuk dengan `importBatchId` yang sama | [ ] |
| 9.5 | Cek Location baru otomatis dibuat sesuai nama unik dari Excel, dengan ID `${lineId}__${slug}` | Location muncul otomatis di tab Line masing-masing | [ ] |
| 9.6 | Klik "Undo Import" pada toast/notifikasi (dalam window waktu yang ditentukan) | Semua data dengan `importBatchId` itu terhapus, kembali kosong | [ ] |

---

## 10. Export Excel (`/admin/export`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 10.1 | Export per-Line (1 file, 1 sheet) | File terunduh, kolom & data sesuai 13 kolom final | [ ] |
| 10.2 | Export gabungan (1 file, 4 sheet) | Semua Line ada di file yang sama, 1 sheet per Line | [ ] |
| 10.3 | Cek kolom Qty & Qty WH yang bernilai 0 | Tetap muncul sebagai `0`, TIDAK hilang/kosong | [ ] |
| 10.4 | Preview sebelum download | Tampilan preview sesuai dengan hasil file yang akan diunduh | [ ] |

---

## 11. Dashboard (`/`)

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 11.1 | Buka sebagai admin | 4 bagian (Ringkasan Status, Progress Kelengkapan, Breakdown Category, Checklist Location) tampil dengan data real | [ ] |
| 11.2 | Buka sebagai publik (tanpa login/Incognito) | 4 bagian yang SAMA tampil (agregat), tapi TIDAK ada link ke grid mentah atau halaman admin manapun | [ ] |
| 11.3 | Breakdown Category | Kategori dengan casing berbeda (mis. "Breaker"/"breaker") dihitung sebagai 1 kategori gabungan, kategori kosong TIDAK muncul | [ ] |
| 11.4 | Checklist per Location | Location dengan SEMUA baris lengkap ditandai ✓, yang belum tidak | [ ] |
| 11.5 | Ubah setting kelengkapan di `/admin/settings`, balik ke Dashboard | Angka Progress Kelengkapan ikut berubah (grid & Dashboard 1 sumber kebenaran) | [ ] |

---

## 12. PWA & Hosting

| # | Skenario | Hasil yang diharapkan | Lolos? |
|---|---|---|---|
| 12.1 | Buka URL hosting di HP Android (Chrome) | Muncul opsi install / bisa install manual via menu ⋮ | [ ] |
| 12.2 | Buka URL hosting di iPhone (Safari) | Bisa "Add to Home Screen" manual via tombol Share | [ ] |
| 12.3 | Install & buka dari homescreen | Tampil seperti app native (tanpa address bar browser) | [ ] |
| 12.4 | Deploy ulang setelah ada perubahan kode | Data existing di Firestore TIDAK terpengaruh sama sekali | [ ] |

---

## Catatan Umum

- Testing offline (bagian 5) adalah yang **paling kritis** — ini alasan utama aplikasi ini dibangun. Jangan skip bagian ini kalau ada perubahan apapun di fungsi tulis-data (addDoc/updateDoc/setDoc/writeBatch).
- Kalau AI editor bilang sebuah fitur "sudah diperbaiki/selesai", tetap jalankan bagian relevan di checklist ini sebelum menandainya selesai di PROGRESS.md — jangan cuma percaya dari deskripsi/walkthrough.
- Dokumen ini boleh terus ditambah baris/bagian baru kalau ada fitur baru ke depannya.
