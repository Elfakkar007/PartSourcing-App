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
  - ✅ **Sudah diverifikasi manual di browser — LOLOS SEMUA**: Tambah Sekaligus,
    Bulk Delete (soft-delete), Duplikat Baris, dan permission check intern
    lintas-Line untuk fitur bulk semuanya berfungsi sesuai harapan.
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
- ✅ **Isi Kolom Massal (Bulk Fill) — SELESAI**:
  - Tombol baru "Isi Kolom Massal" muncul saat ada baris yang dicentang.
  - Membuka `BulkFillModal` (via Portal) untuk memilih kolom (kecuali foto) dan memasukkan nilai baru (text/number/select menyesuaikan tipe kolom).
  - Update dikerjakan secara batching (`writeBatch`) fire-and-forget.
  - Baris tetap tercentang setelah update berhasil agar bisa diisi kolom lainnya.
- ✅ **Peningkatan UI (Notifikasi Toast) — SELESAI**:
  - Menggantikan `alert()` bawaan peramban (browser) yang memblokir dengan komponen Toast kustom (`ToastContext`).
  - Toast muncul di sudut kanan bawah dengan warna dan ikon sesuai jenis pesannya (`success`, `error`, `info`) lalu menghilang otomatis (4 detik).
  - Diimplementasikan pada aksi Bulk Fill, pengecekan hak akses (Permission Denied), dan proses asinkron lainnya agar interaksi tidak terpotong (non-blocking).
- ✅ **Cari & Ganti (Find & Replace) — SELESAI**:
  - Tombol baru "Cari & Ganti" di toolbar (berlaku untuk semua baris yang ter-load di lokasi aktif).
  - Modal dinamis dengan pilihan filter eksklusif pada kolom bertipe `text` (mengecualikan tipe numerik, _select_, atau media/foto).
  - Mengimplementasi fitur _live-preview_ pintar di dalam modal. Preview langsung merender kolom terkait yang mengalami kecocokan pencarian (*case-insensitive*) berserta perbandingan langsung (*old vs new value*).
  - Mengandalkan update efisien _batch_ di fire-and-forget.
- ✅ **Migrasi Data Location & Penambahan Lokasi Baru — SELESAI, dengan 1 bug
  ditemukan & perlu diperbaiki**:
  - Mengonversi data lokasi dari object hardcode menjadi koleksi `locations` di Firestore.
  - Implementasi *real-time listener* (`onSnapshot`) di `LinePage.jsx` untuk _rendering_ tab Locations yang dinamis.
  - Skrip migrasi berhasil dieksekusi satu kali lewat `App.jsx` kemudian dibersihkan.
  - Menambahkan tombol "Tambah Lokasi" dan *modal* yang aman dari masalah clipping, otomatis pindah _tab_ sesaat lokasi berhasil ditambahkan.
  - ✅ **Bug SUDAH DIPERBAIKI**: menambah Location dengan nama yang SUDAH ADA
    di Line yang sama sebelumnya menampilkan pesan salah "Permission denied:
    Anda tidak memiliki akses..." — padahal user sebenarnya PUNYA akses, cuma
    nama itu udah dipakai. Root cause: ID Location dibuat dari slugify nama
    (misal "Boiler Room" → `boiler-room`); karena ID itu sudah ada, `setDoc()`
    diperlakukan Firestore sebagai "update" (dibatasi khusus admin di
    Security Rules), bukan "create" (yang harusnya diizinkan untuk intern).
    Fix: cek duplikat nama (case-insensitive) SEBELUM memanggil setDoc, pesan
    Toast yang jelas ("Lokasi '[nama]' sudah ada di Line ini"), modal tetap
    terbuka. Security Rules (update hanya admin) tetap dipertahankan sebagai
    lapisan pengaman kedua untuk race condition.

- ✅ **SELESAI & TERVERIFIKASI: Panel Konfigurasi Admin** — halaman
  `/admin/settings` untuk mengatur kolom mana yang jadi syarat "baris selesai"
  dan kolom mana yang ditampilkan/disembunyikan di grid, disimpan real-time
  di `settings/gridConfig` Firestore (bukan hardcode).
  - `AdminRoute` (App.jsx): cek `currentUser` + `userRole === 'admin'`,
    redirect ke Dashboard kalau bukan admin — sudah diuji, intern akses
    langsung via URL berhasil di-redirect.
  - Tidak ada kolom yang dikunci — visibility & syarat-kelengkapan toggle
    independen untuk semua 11 kolom (keputusan final, bukan hardcode subset).
  - `isRowComplete(row)` di LinePage.jsx sudah dikonfirmasi LANGSUNG dari kode
    (bukan cuma klaim walkthrough AI editor) membaca `gridConfig.requiredColumns`
    dari state (via `onSnapshot` ke `settings/gridConfig`), BUKAN array
    hardcode — perubahan setting admin langsung memengaruhi hasil kelengkapan
    secara real-time. Pengecualian Qty (boleh kosong jika Status = "Tidak
    Aktif") tetap dipertahankan, hardcode ke kolom qty spesifik (memang
    seharusnya begitu karena aturan bisnisnya sendiri spesifik ke kolom ini).
  - Diverifikasi manual pakai DevTools (cek class `incomplete-row` di elemen
    nomor baris berubah real-time saat setting admin diubah, tanpa reload) —
    LOLOS. Indikator visual (styling CSS) belum ditambahkan, tapi logika
    intinya sudah pasti berfungsi.
  - `visibleColumns` (filter dari `gridConfig.hiddenColumns`) sudah dikonsumsi
    konsisten di header grid, cell, Modal Cari & Ganti, dan Modal Isi Massal.
  - Security Rules `match /settings/{docId}` (read: isSignedIn, write: isAdmin)
    sudah ditambahkan user ke Firebase Console.
  - Bug bawaan dari fitur sebelumnya (kolom terkunci tidak konsisten) sempat
    muncul di walkthrough pertama, sudah diperbaiki di walkthrough kedua.

- ✅ **SELESAI & TERVERIFIKASI: Recycle Bin (`/admin/recycle-bin`)**

  - `handleDelete` (LinePage.jsx) menyimpan `deletedBy: currentUser?.uid` +
    `deletedAt: serverTimestamp()` di setiap dokumen yang di-soft-delete —
    terverifikasi lewat Firebase Console, UID terisi benar.
  - Halaman `/admin/recycle-bin` (dilindungi AdminRoute): tabel lintas semua
    Line, kolom Line/Location/Sub-Machine/Part/Dihapus Oleh/Waktu Hapus,
    diurutkan terbaru dulu. Tombol Pulihkan (single & bulk) dan Hapus
    Selamanya (single & bulk, via `deleteDoc` asli + `ConfirmDeleteModal`
    yang sudah diekstrak jadi komponen reusable `src/components/ConfirmDeleteModal.jsx`).
  - Search bar (client-side, cocok ke `subMachine`/`part`) + filter dropdown
    Line & "Dihapus Oleh" (AND dengan search) + bulk checkbox selection
    (reset otomatis saat filter berubah, "Pilih Semua" cuma pilih baris yang
    sedang tampil setelah filter) — semua sudah diverifikasi baca kode
    asli, bukan cuma klaim walkthrough.
  - Security Rules `components`: `allow delete: if isAdmin();` ditambahkan
    terpisah dari `allow create, update` (supaya intern TIDAK bisa
    `deleteDoc` permanen, meski tetap boleh soft-delete/`updateDoc` baris di
    Line-nya sendiri seperti biasa) — sempat 2x AI editor mengusulkan rules
    yang salah (fungsi `canEditRow()` yang tidak pernah ada + `create`
    kehilangan syarat `line == myLine()`), JANGAN pernah pakai rules dari
    draft manapun tanpa verifikasi ulang terhadap rules yang sedang aktif.
  - Field `email` sempat kosong di sebagian dokumen `users` (Cuma ada
    `role`+`assignedLine`), menyebabkan "Unknown User" di kolom "Dihapus
    Oleh" — sudah diisi manual oleh user di Firebase Console (bukan bug kode).
  - Bug regresi sempat muncul & sudah diperbaiki: kolom Foto sempat tidak
    sengaja ke-render sebagai `<input type="number">` (bukan text) gara-gara
    percabangan mode-edit `EditableCell` cuma eksplisit menangani
    `select`/`text`, semua type lain (termasuk `foto`) jatuh ke fallback
    number. Sudah diperbaiki: tambah percabangan eksplisit `number`, fallback
    terakhir sekarang `text` biasa.

- 🚨 **Bug besar ditemukan & DIPERBAIKI: ID Location bentrok antar-Line**
  — Root cause: ID dokumen `locations` dibuat murni dari slugify nama
  (`chiller-ahu`), TANPA namespace per Line. Kalau 2 Line punya lokasi
  dengan nama sama (sangat umum: "Motor Room", "Chiller AHU", dll dipakai
  berulang di banyak Line), mereka rebutan 1 dokumen ID yang sama.
  Konsekuensi nyata yang sempat kejadian: intern Line 4 bikin lokasi
  "Chiller AHU" (sudah ada duluan milik Line 1) → Security Rules menolak
  (update lokasi cuma boleh admin, sedangkan create/rename oleh intern
  ditolak) → rollback ke kondisi server (`line` balik ke `"line1"`) → tab
  lokasi hilang dari Line 4 → baris (components) yang sudah keburu diisi
  intern OFFLINE ke lokasi itu jadi "yatim" (tersimpan valid di Firestore
  dengan `locationId` yang benar, tapi tidak muncul di UI manapun karena
  tidak ada lagi dokumen `locations` yang match kombinasi id+line-nya).
  **Fix**: ID location sekarang `${lineId}__${slug}` (misal
  `line4__chiller-ahu`), dijamin unik per Line. Data lama (format ID tanpa
  prefix Line) tetap kompatibel terbaca, cek duplikat berbasis nama
  (case-insensitive) terhadap lokasi Line yang sama saja — sudah
  diverifikasi langsung dari kode.
  **Catatan**: karena fitur Export/Import Excel akan menyapu bersih semua
  data existing (kecuali `users`) dan gantikan dengan data import baru,
  baris "yatim" dari masa testing ini TIDAK PERLU dikejar/dipulihkan
  manual — akan otomatis terganti saat proses import nanti.
  - `handleAddLocation` sekaligus diubah ke pola fire-and-forget (sebelumnya
    satu-satunya fungsi tulis-data yang masih pakai `await`, beda sendiri
    dari `handleAddRow`/`handleBulkAdd`/`handleDuplicate`/`handleDelete`
    yang sudah fire-and-forget dari awal) — sudah diverifikasi dari kode.

- ⬜ **Backlog berikutnya (urutan final disepakati, belum dikerjakan sama sekali):**
  1. Log Aktivitas (siapa-ubah-apa-kapan secara umum, bukan cuma delete)
  2. Kolom Category → combobox/autocomplete (cegah typo "beraker" vs
     "Breaker", tetap bisa tambah kategori baru bebas)
  3. Export/Import Excel (fitur besar, lihat Spesifikasi §8: preview,
     mapping kolom manual, validasi per baris, undo per batch, export
     per-Line & gabungan 4 sheet) — akan jadi proses "reset bersih" data
     testing/dummy yang ada sekarang, digantikan data asli dari Excel user
  4. Sambungkan Dashboard ke data Firestore asli (SENGAJA diletakkan
     PALING TERAKHIR, setelah Import — supaya Dashboard langsung dibangun
     & dites terhadap data final/asli, bukan data dummy yang toh akan
     disapu bersih; menghindari kerja & testing dua kali) — breakdown per
     Category harus baca nilai unik dari data real + warna berbasis hash
     nama kategori, BUKAN hardcode/urutan alfabetis


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
- ✅ Selesai: kolom konfigurasi oleh admin (syarat kelengkapan & visibility per kolom), terverifikasi manual
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

- **Pesan error "Permission denied" menyesatkan saat sebenarnya masalahnya
  duplikat data**: menambah Location dengan nama yang sudah ada menampilkan
  pesan seolah user tidak punya akses, padahal akar masalahnya adalah ID
  hasil slugify sudah dipakai, membuat `setDoc()` diperlakukan sebagai
  "update" (dibatasi admin) alih-alih "create" (diizinkan intern). →
  **Pelajaran umum**: kalau sebuah operasi punya 2 kemungkinan alasan gagal
  yang berbeda (izin vs data duplikat), jangan andalkan Security Rules
  sebagai satu-satunya sumber pesan error ke user — cek kondisi yang lebih
  spesifik (misal duplikat) di sisi aplikasi SEBELUM mengirim request,
  supaya pesan yang ditampilkan akurat sesuai akar masalah sebenarnya.


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