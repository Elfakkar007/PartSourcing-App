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

- ✅ **SELESAI & TERVERIFIKASI: Log Aktivitas**

  - Helper generik `src/lib/activityLog.js` — fungsi `logActivity(action,
    userId, extra)`, fire-and-forget (addDoc ke collection `activityLog`
    tanpa await), dipakai bersama oleh LinePage.jsx dan RecycleBin.jsx
    (dulunya sempat ada versi lokal duplikat di LinePage.jsx, sudah
    di-extract jadi 1 sumber).
  - Tercatat (aksi besar saja, BUKAN tiap edit cell individual, sesuai
    keputusan user): tambah_baris, bulk_tambah_baris, duplikat_baris,
    bulk_hapus_baris (dipakai juga untuk hapus 1 baris, cuma beda `count`),
    tambah_lokasi, pulihkan_baris, bulk_pulihkan_baris, hapus_permanen,
    bulk_hapus_permanen.
  - Security Rules `activityLog`: create hanya kalau `userId` di payload
    sama dengan `request.auth.uid`, update & delete permanen diblokir total
    (`if false`) — log bersifat immutable, tidak bisa diubah/dihapus
    siapapun termasuk admin, supaya bisa dipercaya sebagai audit trail.
  - Halaman `/admin/activity-log` (AdminRoute): tabel lintas semua Line,
    query `limit(200)` + `orderBy('timestamp','desc')` (cegah beban read
    berlebih), label Aksi diterjemahkan ke Bahasa Indonesia yang mudah
    dibaca, kolom Detail gabungkan info Line/Location/count, filter
    dropdown Line & Aksi (client-side), resolve userId → nama/email (reuse
    pola dari RecycleBin.jsx). 100% read-only, tidak ada aksi edit/hapus.
    Tombol akses dari Dashboard (ikon jam, khusus admin) sudah ditambahkan.
  - Diverifikasi manual oleh user — semua aksi ter-track dengan benar,
    filter jalan, redirect intern juga aman.
  - Catatan proses: AI editor sempat 2x ikut mengedit PROGRESS.md meski
    sudah diminta tidak — kalau kejadian lagi, pertimbangkan keluarkan
    PROGRESS.md dari akses AI editor (taruh di luar folder project atau
    `.gitignore`).

- ✅ **SELESAI & TERVERIFIKASI: Kolom Category → combobox/autocomplete**

  - Pendekatan hemat-read: 1 dokumen agregat `settings/categoryList` berisi
    array `values` (bukan scan seluruh koleksi `components` yang bisa
    3500-4000+ baris — pertimbangan biaya Firestore free tier, karena user
    tidak dapat budget dari perusahaan untuk project ini).
  - `handleSaveCell`: setelah `updateDoc` field `category` berhasil, cek
    dedup case-insensitive terhadap `categoryOptions` state; kalau kategori
    baru, `arrayUnion` fire-and-forget ke `categoryList`. Real-time
    `onSnapshot` ke dokumen itu men-supply `categoryOptions` ke semua Line
    sekaligus (kategori baru dari Line manapun langsung jadi saran di Line
    lain).
  - Security Rules baru: `settings/categoryList` boleh ditulis siapapun yang
    login (intern & admin), beda dari `settings/{docId}` umum yang tetap
    admin-only untuk `gridConfig`.
  - UI: `<input type="text" list="category-suggestions-${rowId}">` +
    `<datalist>` HTML5 native — tetap bisa ketik bebas kategori baru
    (taksonomi organik, tidak terkunci ke daftar).
  - 🐛 **Bug sempat terjadi & sudah diperbaiki**: percobaan pertama
    memasang datalist di branch fallback terakhir `EditableCell`, padahal
    kolom `category` di `COLUMNS` bertipe `type: 'text'` (masuk branch
    `<textarea>`, BUKAN fallback) — `<textarea>` juga tidak mendukung
    atribut `list` sama sekali secara native. Dropdown tidak pernah muncul
    di Chrome maupun Brave. Fix: tambah percabangan baru dicek berdasarkan
    `field === 'category'` (bukan `type`), diletakkan SEBELUM cek
    `type === 'text'`, pakai `<input>` single-line + datalist. Field
    `type: 'text'` lain (Sub-Machine, Part, Spesification, dst) TETAP pakai
    `<textarea>` seperti semula, tidak ikut berubah.

- 🔄 **Export/Import Excel** (fitur besar, Spesifikasi §8, punya 2 ARAH
  TERPISAH — jangan disamakan): (A) **Import** — upload → preview →
  mapping kolom manual → validasi per baris → commit → undo per batch;
  (B) **Export** — generate file Excel dari data yang ada, per-Line &
  gabungan 4 sheet, dengan preview sebelum download. Import dipakai lebih
  dulu sebagai proses "reset bersih" data testing/dummy digantikan data
  asli dari Excel user.
  - ✅ **Arah (A) Import — SELESAI SELURUHNYA (Tahap 1-4)**, lihat detail
    tiap tahap di bawah.
  - ⬜ **Arah (B) Export — BELUM DIMULAI SAMA SEKALI.** Ini next feature.

  - ✅ **Tahap 1 (Upload → Parse 4 sheet → Preview mentah, TANPA sentuh
    Firestore) — SELESAI & TERVERIFIKASI** di halaman `/admin/import`:
    - Parsing SheetJS per sheet (1 sheet = 1 Line), preview 20 baris
      teratas + indikator jumlah baris total per Line.
    - 🐛 **Bug ditemukan & diperbaiki**: baris kosong (semua field
      kosong/whitespace) TIDAK cuma muncul di ekor sheet, tapi NYEMPIL di
      TENGAH data (dipakai sebagai pemisah visual antar kelompok part di
      sheet sumber user) — filter awal yang cuma menyapu dari ekor sampai
      baris berisi pertama tidak menangkap kasus ini. Fix: filter SETIAP
      baris secara independen (bukan cuma trailing), cek darimanapun
      posisinya di sheet.
    - 🐛 **Bug ditemukan & diperbaiki (khusus sheet LINE 1)**: sheet ini
      punya 17 kolom hantu tambahan ("Column 14" s/d "Column 30", 100%
      kosong, sisa formatting Excel yang melebar ke kanan) — berbeda dari
      3 sheet Line lain yang persis 13 kolom. Berisiko mengacaukan
      auto-detect mapping kolom di Tahap 2 kalau tidak ditangani. Fix:
      parser dibatasi HANYA ambil 13 kolom baku berdasar nama/urutan resmi,
      kolom di luar itu diabaikan total.
    - Diverifikasi silang oleh Claude terhadap file Excel asli
      (`Uji_export.xlsx`) yang di-upload user — dihitung manual jumlah
      baris data riil (bukan header, bukan baris kosong) per Line:
      LINE 1 = 1134, LINE 2 = 1089, LINE 3 = 567, LINE 4 = 940. Setelah
      fix, indikator jumlah baris di preview app **cocok persis** dengan
      angka-angka ini — user konfirmasi lolos.
    - **Pelajaran umum**: kalau AI editor bilang "sudah difilter" tapi
      angka tidak berubah, jangan asumsikan filter-nya cuma kurang
      dijalankan — cek dulu APAKAH filter itu menyasar pola data yang
      benar (di kasus ini: kosong bisa di tengah, bukan cuma di ekor).
      Baca file sumber asli langsung kalau tersedia, jangan cuma percaya
      angka yang dilaporkan.

  - ✅ **Tahap 2 (Mapping kolom + Validasi per baris) — SELESAI &
    TERVERIFIKASI** di `ImportExcel.jsx`:
    - Mapping: 13 kolom baku di-auto-detect dari header asli (exact match,
      case-insensitive, trim), dengan UI dropdown per kolom untuk override
      manual kalau auto-detect meleset. Mapping disimpan per-Line.
    - **Keputusan bisnis penting (revisi dari rencana awal)**: validasi
      import SENGAJA TIDAK mensyaratkan 7 kolom wajib terisi — ini beda
      dari aturan "baris selesai" di grid (`isRowComplete`, Spesifikasi §5)
      yang TETAP 7 kolom. Alasan: kelengkapan data adalah tugas anak
      magang mengisi PROGRESIF lewat grid web setelah data masuk, bukan
      syarat untuk bisa di-import. Baris boleh masuk sepenuhnya kosong di
      semua kolom kecuali kolom itu sendiri (row kosong-total tetap
      di-exclude, itu aturan Tahap 1, tidak berubah).
    - Validasi yang TETAP jalan (hanya FORMAT, hanya kalau field terisi):
      - Qty: kalau terisi, harus valid sebagai angka. Kalau bukan angka
        (misal teks "lima"), di-flag "Kesalahan Format". Kalau kosong,
        lolos tanpa syarat apapun (aturan lama "Qty boleh kosong kalau
        Status = Tidak Aktif" sudah tidak relevan lagi & dihapus).
      - Status: kalau terisi, harus PERSIS "Existing" atau "Tidak Aktif"
        (case-sensitive, exact match). Nilai lain (typo/kapitalisasi beda)
        di-flag "Status tidak dikenali: '<nilai asli>'". Kalau kosong,
        lolos tanpa syarat.
      - Kolom lain: bebas, tidak ada validasi format.
    - Laporan diganti framing-nya dari "Lolos/Gagal Validasi" menjadi
      "Baris dengan Kesalahan Format" (supaya tidak menyiratkan baris
      tsb akan dibuang — baris begini TETAP akan ikut ter-import di
      Tahap 3, cuma perlu perhatian ekstra).
    - Diverifikasi user dengan `UjiExport.xlsx` (versi bersih, Status sudah
      diperbaiki dari "Modifikasi" jadi cuma "Existing"/"Tidak Aktif") —
      hasil aman, user konfirmasi lolos.
    - Tombol "Import Sekarang" tetap disabled sesuai scope Tahap 2 — belum
      ada tulis-data ke Firestore sama sekali.

  - ✅ **Tahap 3 (Commit: hapus data lama + tulis data baru + auto-create
    Location) — SELESAI & TERVERIFIKASI**:
    - Urutan eksekusi: hitung X/Y/Z/W → dialog konfirmasi (angka eksplisit,
      bukan "OK" generik) → hapus permanen `components`+`locations` lama
      (exclude `users`) → auto-create `locations` baru (skema
      `${lineId}__${slug}`, baris tanpa Location dikelompokkan ke
      placeholder "Belum Ada Lokasi" per Line, supaya tidak ada baris
      yatim) → tulis `components` baru. Semua pakai `writeBatch` dipecah
      500 dokumen/batch, sekuensial (bukan `Promise.all`).
    - `importBatchId` (1 UUID per sesi commit) ditandai di SEMUA dokumen
      baru — baik `components` MAUPUN `locations` — supaya Tahap 4 (Undo)
      nanti bisa bersihkan keduanya sekaligus.
    - Keputusan bisnis: baris dengan "Kesalahan Format" (dari Tahap 2)
      TETAP ikut ter-import apa adanya (Qty non-angka disimpan sebagai
      string mentah, bukan dibuang/dikosongkan) — commit TIDAK diblokir
      oleh baris bermasalah, admin benerin manual belakangan di grid.
    - 🐛 **Bug besar ditemukan & diperbaiki**: percobaan pertama
      menghasilkan SEMUA baris kosong tak berisi di grid meski jumlah
      baris & lokasi sudah benar. Root cause: `ImportExcel.jsx` menulis
      field ke Firestore pakai nama header Excel APA ADANYA (`"Sub-Machine"`,
      `"Item Code"`, dst — dengan spasi/tanda hubung), padahal
      `LinePage.jsx`/grid membaca properti pakai konvensi camelCase
      (`subMachine`, `itemCode`, dst) — mismatch total, data tersimpan
      tapi di key yang salah. Fix: kamus `fieldMapping` (hardcoded, "Anti-
      Corruption Layer") ditambahkan di `handleCommitImport` buat
      menerjemahkan SEMUA 11 field (10 via kamus + `qty` ditangani
      terpisah karena butuh type-casting Number) sebelum `batch.set()`.
    - **Pelajaran penting buat sesi berikutnya**: kalau AI editor kasih
      progress report/insiden-report yang kedengaran meyakinkan (istilah
      teknis kayak "Anti-Corruption Layer"), TETAP minta kode asli
      `fieldMapping`-nya buat dicek satu-satu terhadap daftar 11 kolom —
      jangan percaya cuma dari narasinya. Setelah dicek: SEMUA 11 field
      benar ter-mapping (`subMachine`, `itemCode`, `category`, `part`,
      `description`, `spesification`, `warehouseName`, `status`, `foto`,
      `qtyWh`, `qty`), dikonfirmasi juga oleh user lewat cek visual grid
      (semua kolom, bukan cuma sebagian) SETELAH re-run commit dari nol.
    - Diverifikasi hasil akhir dengan `UjiExport.xlsx`: 3730 baris (LINE 1:
      1134, LINE 2: 1089, LINE 3: 567, LINE 4: 940) + 85 lokasi baru,
      semua cocok dengan proyeksi manual Claude sebelum commit dijalankan.
    - **Known limitation (BUKAN bug kode) ditemukan**: preview hover/tap
      foto Gdrive gagal untuk sebagian besar link asli, meski link sudah
      di-share publik dengan benar (sudah dicek & dikonfirmasi). Kode
      aplikasi SUDAH benar (pakai `<img src>` native + `onError`, BUKAN
      `fetch()`/`XHR` — sempat dicurigai salah, tapi terbukti dari kode
      asli `FotoDisplay` di LinePage.jsx itu dugaan keliru). Diagnosa lewat
      DevTools Network tab: request thumbnail redirect 302 berhasil, tapi
      request lanjutannya ke `lh3.googleusercontent.com` gagal dengan
      `net::ERR_BLOCKED_BY_ORB` (Opaque Response Blocking, fitur keamanan
      Chrome). Dugaan penyebab: Google Drive butuh cookie session buat
      endpoint thumbnail-nya, browser modern (Chrome dkk) makin ketat
      blokir cookie pihak-ketiga by default, jadi Google balikin
      halaman HTML (bukan bytes gambar) → Chrome blokir lewat ORB sebelum
      sempat dirender. Ini SIFATNYA STRUKTURAL (soal domain app vs domain
      Google, bukan soal localhost vs hosting) — kemungkinan besar TETAP
      terjadi setelah production deploy, tidak otomatis hilang. Klik-buka-
      link langsung ke Drive tetap berfungsi normal — cuma preview visual
      hover/tap yang kena. Solusi permanen (belum dikerjakan, backlog
      terpisah): proxy server-side via Firebase Cloud Functions yang ambil
      gambar lewat Google Drive API (server-to-server, tidak kena batasan
      cookie browser) lalu disajikan dari domain sendiri. Kalau muncul
      lagi di sesi depan, JANGAN dikira bug baru dari kode aplikasi.

  - ✅ **Tahap 4 (Undo Import) — SELESAI & TERVERIFIKASI, dengan 2 bug
    ditemukan & diperbaiki sebelum lolos**:
    - Scope: link "Undo" di toast sukses import (durasi diperpanjang jadi
      15 detik), klik → `ConfirmDeleteModal` (angka X baris/Y lokasi
      eksplisit, bukan OK generik) → hapus semua dokumen `components` DAN
      `locations` dengan `importBatchId` yang sama, pakai `query()+where()`
      (bukan getDocs semua+filter manual — hemat read quota), chunk 500
      dokumen/batch via `writeBatch`. TIDAK ada halaman riwayat import
      terpisah, TIDAK bisa undo batch lama kapan pun — cuma lewat toast
      yang masih nempel di layar.
    - 🐛 **Bug 1 (arsitektur) — Undo silently broken kalau pindah halaman**:
      percobaan pertama menaruh state konfirmasi Undo (`showUndoConfirm`,
      `undoStats`) di komponen `ImportExcel.jsx` yang page-local. Kalau
      user pindah ke halaman lain (misal `/line/1` buat cek hasil import —
      dikonfirmasi ini kebiasaan realistis) dalam window 15 detik sebelum
      toast hilang, komponen unmount, klik tombol Undo di toast (masih
      kelihatan nempel karena `ToastProvider` global) jadi TIDAK BEREFEK
      APAPUN tanpa error apapun — silently broken. Fix: logic Undo
      (state + eksekusi) dipindah ke context/provider baru
      (`src/contexts/ImportUndoContext.jsx`) yang dipasang di root App
      (`App.jsx`) — di dalam `<ToastProvider>`+`<AuthProvider>` (supaya
      `useToast()`/`useAuth()` tetap bisa dipakai) tapi di LUAR
      `<Routes>` (supaya tidak pernah unmount saat pindah halaman). Logic
      hapus (`query+where`+`writeBatch` chunk 500) diekstrak jadi fungsi
      murni tanpa dependency React di `src/lib/importUndo.js`. Diverifikasi
      Claude baca kode asli ketiga file (`App.jsx`, `ImportUndoContext.jsx`,
      `importUndo.js`) satu-satu terhadap 4 poin requirement — semua benar,
      dan `ImportExcel.jsx` sudah bersih dari sisa state Undo lama.
    - 🐛 **Bug 2 (regresi baru, ditemukan Claude dari baca kode, BUKAN dari
      `npx vite build` yang "sukses")**: refactor Bug 1 di atas
      meninggalkan `ImportExcel.jsx` memanggil `useNavigate()` (dipakai di
      tombol "←" header) TANPA `import { useNavigate } from
      'react-router-dom'` — bikin halaman `/admin/import` CRASH TOTAL saat
      dibuka (`ReferenceError: useNavigate is not defined`), bahkan
      sebelum sempat sampai step upload file. `npx vite build` tetap
      lolos bersih karena ini `ReferenceError` runtime murni (bukan error
      sintaks/import gagal resolve), bukan sesuatu yang ditangkap type-
      checking Vite/esbuild biasa. Fix: tambah baris import yang hilang.
      **Pelajaran umum (tambahan)**: `npx vite build` sukses TIDAK berarti
      halaman bisa dirender — tetap wajib baca kode asli & testing manual
      di browser, terutama setelah refactor yang menyentuh banyak import.
    - Setelah kedua fix: user konfirmasi testing manual — import → pindah
      halaman dalam window 15 detik → balik → klik Undo di toast → batch
      terhapus dengan benar. **Fitur Import Excel (Tahap 1-4) resmi
      TUNTAS seluruhnya.**
  2. Sambungkan Dashboard ke data Firestore asli (SENGAJA diletakkan
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

- ✅ **Selesai & terverifikasi: IMPORT Excel (Tahap 1-4 LENGKAP)** —
  Upload→Parse→Preview, Mapping+Validasi, Commit (hapus lama+tulis baru+
  auto-create Location), dan Undo per-batch. Lihat detail lengkap tiap
  tahap (termasuk semua bug & fix) di bagian atas.
- ✅ **SELESAI & TERVERIFIKASI: EXPORT Excel** — halaman `/admin/export`,
  arah terpisah dari Import (Spesifikasi §8): generate file Excel per-Line
  (1 sheet) & gabungan (4 sheet), preview sebelum download, pakai SheetJS.
  Ini juga fitur dengan bug terbanyak yang ketemu sebelum lolos — dicatat
  lengkap di bawah biar polanya diingat:
  - 🐛 **Bug 1 — Kolom `Qty` selalu kosong**: `fieldMapping` (dictionary
    hasil invert dari `ImportExcel.jsx`) tidak punya key `'Qty'`, tapi ada
    percabangan `if (stdCol === 'Qty')` DI DALAM loop
    `Object.entries(fieldMapping).forEach(...)` — karena `Qty` tidak
    pernah jadi key di object itu, percabangan itu tidak pernah kejalan.
    Fix: `Qty` di-assign eksplisit DI LUAR loop.
  - 🐛 **Bug 2 — Kolom `Qty WH` bisa kehilangan nilai `0` yang valid**:
    bug kelas sama dengan Bug 1 tapi lolos dari review pertama — field ini
    masih diproses lewat `row[camelKey] || ''` generic, dan `0` itu falsy
    di JavaScript jadi ke-render sebagai string kosong. Fix: `Qty WH`
    dikeluarkan dari `fieldMapping`, di-assign eksplisit dengan
    `!== undefined && !== null` seperti `Qty`. **Pelajaran umum**: kalau
    satu kolom numerik sudah diketahui rawan bug falsy-zero, cek SEMUA
    kolom numerik lain yang polanya mirip — jangan cuma fix yang
    dilaporkan lalu berhenti.
  - 🐛 **Bug 3 (KRITIS, root cause dari "halaman kelihatan rusak total")
    — `ExportExcel.jsx` pakai nama CSS custom property yang TIDAK ADA di
    proyek**: proyek ini pakai Tailwind v4 dengan token warna di
    `index.css` (`@theme` block) yang SEMUA diberi prefix `--color-`
    (`--color-primary`, `--color-canvas`, `--color-border`, `--color-ink`,
    `--color-ink-muted`, `--color-surface-subtle`, dst — lihat cara
    `LinePage.jsx` yang sudah benar pakai `var(--color-border)` dst).
    Tapi `ExportExcel.jsx` ditulis dengan asumsi nama tanpa prefix
    (`var(--primary)`, `var(--canvas)`, `var(--border)`, dst), dan
    beberapa malah nama yang TIDAK ADA sama sekali dengan nama apapun
    (`var(--surface-sunken)`, `var(--rounded-lg)`, `var(--shadow-subtle)`
    — `shadow-subtle` di proyek ini adalah CLASS CSS `.shadow-subtle`,
    bukan custom property). Efeknya: browser menganggap semua referensi
    `var()` itu invalid di computed-value time → nilai properti jatuh ke
    default (background transparent, border-radius 0, shadow hilang).
    Ini yang bikin tombol "Download Excel" nyaris tak terlihat (background
    transparan, teks tetap putih dari class `.btn-primary`) dan seluruh
    card/border di halaman kehilangan styling. **Pelajaran umum**: kalau
    AI editor menulis halaman baru dengan `var(--nama-token)` yang
    "kedengaran masuk akal" berdasarkan dokumen desain, WAJIB cross-check
    ke `index.css`/`:root`/`@theme` ASLI proyek (atau ke halaman lain yang
    sudah terbukti jalan) — nama token di dokumen desain (`DESIGN-*.md`)
    tidak otomatis sama dengan nama variable yang benar-benar
    diimplementasikan di kode.
  - 🐛 **Bug 4 — Tidak ada link navigasi ke `/admin/export`**: route sudah
    benar terpasang di `App.jsx`, tapi tidak ada tombol di `Dashboard.jsx`
    yang mengarah ke sana (menu admin cuma ada Import/Activity
    Log/Recycle Bin/Pengaturan Kolom) — halaman baru ini praktis tidak
    bisa diakses lewat penggunaan normal. Fix: tambah tombol "Export" di
    blok menu admin `Dashboard.jsx`, pola sama dengan tombol Import.
  - 🐛 **Bug 5 (minor) — Tombol "←" di header Export salah tujuan**:
    `onClick={() => navigate('/admin/settings')}` — mengarah ke halaman
    Pengaturan Admin/Konfigurasi Grid, bukan ke Dashboard. Kemungkinan
    sisa copy-paste dari struktur `ImportExcel.jsx` yang tidak sempat
    disesuaikan. Fix: ganti jadi `navigate('/')`.
  - Housekeeping: kode `.s.font.bold` untuk bold header dihapus setelah
    dikonfirmasi library `xlsx` versi Community tidak mendukung cell
    styling (dead code, silently no-op) — user memutuskan skip bold,
    cukup auto-width kolom yang memang berfungsi.
  - Setelah semua fix: user konfirmasi testing manual — preview & download
    kedua mode (Per-Line & Gabungan) berhasil, kolom lengkap termasuk Qty
    bernilai 0, tombol back & navigasi Dashboard→Export sudah benar.
    **Fitur Export Excel resmi TUNTAS.**
- 🔄 Next up: **Sambungkan Dashboard ke data Firestore asli** (data masih
  placeholder/dummy) — sesuai urutan yang direncanakan sejak Sesi 1.
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


- **Undo Import silently broken kalau user pindah halaman**: state
  konfirmasi Undo sempat ditaruh page-local di `ImportExcel.jsx` —
  komponen unmount saat navigasi, klik "Undo" di toast (yang masih
  tampil global) jadi tidak berefek apapun tanpa error. → Diperbaiki
  dengan memindah state+logic Undo ke context/provider (`ImportUndoContext`)
  yang dipasang di root `App.jsx`, di luar `<Routes>`. **Pelajaran umum**:
  state untuk aksi yang harus "bertahan hidup" lintas navigasi (toast
  undo, proses background, dll) tidak boleh ditaruh di komponen page —
  taruh di context/provider level root.
- **`npx vite build` sukses tapi halaman crash total saat dibuka**:
  refactor Undo di atas meninggalkan `useNavigate()` terpakai di
  `ImportExcel.jsx` tanpa `import { useNavigate } from 'react-router-dom'`
  — `ReferenceError` runtime murni, tidak ketangkap build karena Vite/
  esbuild tidak melakukan pengecekan scope variabel seperti linter/
  TypeScript. → Diperbaiki dengan menambah baris import yang hilang.
  **Pelajaran umum**: build sukses BUKAN bukti halaman bisa dirender —
  tetap wajib baca kode asli & testing manual di browser, terutama
  setelah refactor yang menyentuh banyak import.

- ✅ Label role di header — akar masalah Firestore Rules, sudah diperbaiki.
- ✅ Dashboard intern menampilkan semua Line — keputusan final, dengan highlight visual.
- ✅ Cell widening untuk kolom teks panjang — diubah dari horizontal overlay menjadi auto-resize vertikal (`textarea`) untuk UX yang lebih baik.
- ✅ Penambahan garis batas vertikal kolom grid untuk kejelasan batas data.
- ✅ Hover/tap preview Foto — sudah berfungsi penuh setelah fix Portal.
- ✅ Undo Import cross-page-navigation — sudah diperbaiki dengan context/provider di root.
- ✅ `useNavigate` tidak ter-import di `ImportExcel.jsx` (bikin halaman crash) — sudah diperbaiki.
- ✅ Export Excel: kolom `Qty` & `Qty WH` kosong/hilang nilai `0` — sudah diperbaiki.
- ✅ Export Excel: mismatch nama CSS variable (`var(--primary)` dst vs `--color-*` yang
  benar) bikin halaman kehilangan seluruh styling — sudah diperbaiki.
- ✅ Export Excel: tidak ada tombol navigasi dari Dashboard & tombol back salah tujuan —
  sudah diperbaiki.

## File Acuan (selalu sertakan saat mulai sesi baru dengan AI editor)
- `Spesifikasi_App_Plant_Sourcing.md` — spesifikasi fitur & arsitektur lengkap
- `DESIGN-plant-sourcing.md` — design system (warna, tipografi, komponen grid, dll)
- `PROGRESS.md` — file ini
- `Checklist_Testing_Grid.md` — checklist manual testing untuk fitur grid (baru)