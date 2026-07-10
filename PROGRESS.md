# Progress — Plant Sourcing App

> File ini di-update tiap kali ada progress berarti (fitur baru selesai, atau bug-fix yang mengandung pelajaran penting). Selalu paste isi file ini di awal sesi baru ke AI editor mana pun yang dipakai.

## Status Sekarang
- ✅ Setup project React + Vite + Tailwind + Firebase
- ✅ Firebase Auth aktif (Email/Password), 5 user dibuat (1 admin + 4 intern)
- ✅ Firestore koleksi `users` berisi role + assignedLine per akun
- ✅ Firestore Security Rules diperketat: user baca profil sendiri (atau admin baca semua),
  koleksi `components` — read semua yang login, write dibatasi admin atau intern sesuai
  `line` miliknya sendiri
- ✅ Login & Dashboard lengkap, terhubung Firebase Auth + Firestore, design system diterapkan
- ✅ Dashboard: stat cards, progress keseluruhan, progress per Line + checklist lokasi
  (highlight "Line Kamu" untuk intern), breakdown per Category (palet warna netral)
- ✅ Label role di UI: "Admin" dan "Internship" (keputusan gaya, bukan "Anak Magang")
- ✅ **Grid data per Line & Location — SELESAI, iterasi 1 lengkap**, halaman `/line/:lineId`:
  - Tab horizontal per Location (data dummy)
  - Grid 11 kolom sesuai Spesifikasi §4, inline cell editing, auto-save ke Firestore
    dengan indikator ✓, tombol "+ Tambah Baris", real-time via `onSnapshot`
  - Permission check: intern hanya bisa edit Line miliknya — **sudah diuji & PASSED**
    (intern Line lain akses Line lain → ditolak edit, banner read-only muncul benar)
  - Teks panjang pada sel (misal Description/Spesification) kini menggunakan `textarea` yang 
    melebar otomatis ke bawah (vertical auto-resize) saat diedit. Ini menjaga lebar kolom 
    tetap konsisten sehingga data kolom di sebelahnya tidak tertutup dan konteks tetap terjaga.
  - Ditambahkan garis vertikal pemisah antar kolom (`border-right`) pada grid untuk memperjelas 
    batas sel dan mengurangi risiko salah klik (menyesuaikan style spreadsheet).
  - Kolom Foto: hover-preview popup (desktop) & tap-preview modal (mobile) menampilkan
    gambar dari Google Drive — **sudah diperbaiki & berfungsi** (lihat Log Bug di bawah
    soal 2 masalah yang sempat menghambat ini)
- ✅ **Fix offline-first — SELESAI & terverifikasi**: tombol "Tambah Baris"/simpan
  cell tidak lagi macet saat offline (fire-and-forget pada `addDoc`/`updateDoc`,
  tidak menunggu ack server untuk melepas state UI).
- ⚠️ **Sync-status-bar — keterbatasan teknis Firestore SDK, DIPUTUSKAN tidak
  dikejar lebih lanjut (known limitation, bukan blocker)**: `onSnapshot()`
  (listener query berkelanjutan) TIDAK memanggil error callback setiap kali
  gagal connect ke server — dia diam-diam retry di background terus-menerus,
  berbeda dari `getDoc()` yang eksplisit melempar error `unavailable`. Ini
  keterbatasan desain Firestore Web SDK, bukan bug di kode — sehingga status
  "Online" kadang tidak akurat di kondisi jaringan tertentu (terutama saat ada
  adapter jaringan virtual). **Yang penting dan sudah terverifikasi**: data
  TETAP tersimpan benar saat offline (tidak hilang/macet), cuma indikator
  visualnya yang kadang tidak 100% real-time akurat. Workaround (active ping
  berkala pakai `getDoc({source:'server'})`) ada tapi belum diprioritaskan.
- ✅ **Bulk Actions (Tambah Sekaligus, Bulk Delete, Duplikat Baris) — SELESAI
  sebagian besar**, di halaman `/line/:lineId`:
  - Checkbox per baris + "Pilih Semua", highlight hijau muda pada baris terpilih
  - Tombol "Tambah Sekaligus" (modal input 1-100 baris) via `writeBatch`
  - Tombol "Hapus X Terpilih" (kondisional muncul saat ada seleksi), dengan
    `ConfirmDeleteModal` yang menyebutkan jumlah baris & nama lokasi (bukan OK
    generik), soft-delete via `writeBatch` (`isDeleted: true`, `deletedAt`)
  - Duplikat baris per row (icon aksi) via `addDoc`, menyalin semua field
    kecuali `id`/`createdAt`/`lastUpdated`
  - Semua operasi pakai pola fire-and-forget (pelajaran dari fix offline
    diterapkan otomatis ke fitur baru ini)
  - Modal (`ConfirmDeleteModal`, `BulkAddModal`) dirender via React Portal
    (pelajaran dari fix popover Foto diterapkan lagi)
  - `npx vite build` berhasil tanpa error
  - **BELUM diverifikasi manual di browser** (bulk add/delete/duplikat +
    permission check intern lintas-Line) — perlu dites sebelum lanjut
- ✅ **Filter per Kolom — SELESAI & lolos testing**, di halaman `/line/:lineId`:
  - Ikon funnel di tiap header kolom, dropdown checklist nilai unik (via Portal)
  - Filter murni client-side (in-memory), tidak menyentuh Firestore
  - AND logic antar kolom, OR logic antar value dalam 1 kolom (standar Excel
    autofilter), tombol "Hapus semua filter" muncul saat ada filter aktif
  - Indikator visual kolom yang sedang difilter (ikon funnel terisi solid)
- ✅ **Flag "Perlu Ditanyakan"/"Dilewati" per Baris — SELESAI**: 
  - Ikon bendera kecil di samping nomor baris. Popover 3 opsi (via Portal).
  - Background baris menyesuaikan: kuning muda (question), abu-abu muda (skip).
  - Jika dicentang + ber-flag, background flag tetap dipertahankan namun border-left biru tebal ditambahkan sebagai indikator seleksi aktif (mencegah bentrok visual `row-selected`).
  - Fitur Bulk Flag (Tandai Terpilih) di toolbar yang muncul saat baris dicentang, update data dilakukan secara kolektif dengan `writeBatch`.
  - updateDoc fire-and-forget.
- ⬜ **Berikutnya (urutan prioritas dari admin project): Isi ke Baris Terpilih → Cari & Ganti**

  - `handleDelete` belum menyimpan `deletedBy` (siapa yang menghapus) — perlu
    ditambahkan untuk akuntabilitas/log aktivitas
  - Belum ada halaman/panel admin untuk **melihat & memulihkan** baris yang
    di-soft-delete (Recycle Bin view) — soft-delete-nya sendiri sudah jalan,
    tapi belum ada cara restore dari UI
  - Log aktivitas (siapa-apa-kapan secara umum, bukan cuma delete) belum ada
    sama sekali sebagai fitur terpisah

- ℹ️ **Keterbatasan cache offline yang perlu diketahui (bukan bug)**: jika
  sebuah Location belum pernah dibuka sekali pun saat online, datanya TIDAK
  akan muncul saat offline (cache Firestore bersifat per-query, bukan
  download seluruh database). Menambah baris baru tetap bisa berhasil karena
  `addDoc()` tidak butuh membaca data lama. Risiko: anak magang bisa tanpa
  sadar menambah data duplikat di Location yang belum pernah dibuka online.
  **Rekomendasi SOP (bukan perbaikan kode)**: anak magang membuka semua tab
  Location di Line miliknya minimal sekali saat online (misal di awal shift)
  sebelum bekerja di titik dengan sinyal buruk/tanpa sinyal.

- ⬜ Belum: export/import Excel
- ⬜ Belum: dashboard chart & checklist publik (data masih placeholder, belum tersambung
  ke Firestore asli — masih dummy)
- ⬜ Belum: PWA/offline persistence penuh (masih pakai `enableIndexedDbPersistence`, ada
  warning deprecated — migrasi ke `FirestoreSettings.cache` belum urgent, catat sebagai
  utang teknis kecil)
- ⬜ Belum: kolom konfigurasi oleh admin (syarat kelengkapan & visibility per kolom)
- ⬜ Belum: dijalankan checklist testing manual menyeluruh untuk fitur grid (lihat
  dokumen terpisah `Checklist_Testing_Grid.md`)

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
- Label role di UI: "Admin" dan "Internship" (keputusan gaya dari admin project).
- Dashboard intern menampilkan progress SEMUA Line (gabungan, fungsi leaderboard),
  karena datanya cuma agregat, bukan data mentah sensitif.

## Log Bug/Isu yang Pernah Ditemukan (biar tidak terulang)
- **Heading nyaris tak terlihat**: sisa CSS dark-mode bawaan template Vite bentrok
  dengan Tailwind. → Sudah dihapus.
- **Role tampil kosong / label "User" generik**: akar masalah sebenarnya BUKAN nama
  koleksi atau logic mapping role (dua-duanya sudah benar), melainkan **Firestore
  Security Rules masih production mode default** (`allow read, write: if false`) yang
  menolak semua akses termasuk baca profil sendiri. → Diperbaiki di Firebase Console,
  bukan di kode React.
- **Login lambat, duplikat kode/HTML**: sudah diperbaiki di sesi-sesi awal.
- **Warna chart kategori melanggar semantik design system**: sudah diganti palet netral.
- **AI editor kehabisan kuota di tengah pengerjaan cell-widening & Foto-preview**: logic
  JSX selesai duluan, CSS belum sempat ditambahkan → tampilan sementara berantakan.
  → Pelajaran: kalau kuota AI terbatas/sesi bisa terputus, minta CSS & logic dikerjakan
  dalam prompt terpisah dari awal, supaya kalau terputus, satu bagian tetap utuh.
- **Popup preview Foto tidak muncul sama sekali meski CSS & logic sudah benar**: akar
  masalah adalah `.data-grid-wrapper` punya `overflow-x: auto`, yang otomatis membuat
  `overflow-y` browser jadi `auto` juga (bukan `visible`) — sehingga popover yang
  posisinya menyembul keluar dari cell ikut ter-clip vertikal oleh wrapper tabel,
  walau `<td>`-nya sendiri sudah `overflow: visible`. → Diperbaiki dengan me-render
  popover & modal via **React Portal** ke `document.body` (bukan child di dalam tabel),
  posisi dihitung manual pakai `getBoundingClientRect()`. **Pelajaran umum**: kalau ada
  elemen "melayang" (tooltip/popover/dropdown) di dalam container yang punya
  `overflow-x/y: auto|hidden|scroll`, pertimbangkan Portal dari awal alih-alih
  mengandalkan `overflow: visible` di elemen anak — parent yang scrollable akan
  tetap meng-clip elemen tersebut.

- **Tombol "Tambah Baris" (dan simpan cell) macet permanen saat offline**:
  akar masalah `await addDoc()`/`await updateDoc()` menunggu konfirmasi
  server sebelum resolve Promise, padahal data sudah masuk cache lokal lebih
  dulu — saat offline Promise ini menggantung tanpa batas, sehingga state
  loading tidak pernah dilepas. → Diperbaiki dengan tidak menunggu Promise
  untuk melepas state UI, cukup tangkap `.catch()` untuk error
  `permission-denied`.
- **Sync-status-bar salah menampilkan "Online" padahal internet benar-benar
  mati**: `navigator.onLine` cuma mendeteksi ada/tidaknya interface jaringan
  aktif (termasuk adapter virtual VPN/WSL2/Docker), bukan konektivitas
  internet sesungguhnya. → Diperbaiki dengan menyilangkan `navigator.onLine`
  dengan status real dari listener `onSnapshot` Firestore (`unavailable`
  error vs `metadata.fromCache`).

- ✅ Warna chart kategori — palet netral, tidak lagi pakai warna semantik status.
- ✅ Label role di header — akar masalah Firestore Rules, sudah diperbaiki.
- ✅ Dashboard intern menampilkan semua Line — keputusan final, dengan highlight visual.
- ✅ Cell widening untuk kolom teks panjang — diubah dari horizontal overlay menjadi auto-resize vertikal (`textarea`) untuk UX yang lebih baik.
- ✅ Penambahan garis batas vertikal kolom grid untuk kejelasan batas data.
- ✅ Hover/tap preview Foto — sudah berfungsi penuh setelah fix Portal.

## File Acuan (selalu sertakan saat mulai sesi baru dengan AI editor)
- `Spesifikasi_App_Plant_Sourcing.md` — spesifikasi fitur & arsitektur lengkap
- `DESIGN-plant-sourcing.md` — design system (warna, tipografi, komponen grid, dll)
- `PROGRESS.md` — file ini
- `Checklist_Testing_Grid.md` — checklist manual testing untuk fitur grid (baru)