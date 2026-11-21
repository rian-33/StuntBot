# Product Requirements Document
## StuntBot – Pemantauan dan Pencatatan Antropometri Balita

**Status dokumen:** dokumentasi hasil pembacaan codebase  
**Versi:** 1.0  
**Tanggal:** 22 November 2026

Dokumen ini menjelaskan fitur dan perilaku yang sudah tampak pada source code proyek. Bagian “Batasan dan pekerjaan lanjutan” membedakan kemampuan yang belum tersedia dari fitur yang sudah berjalan di kode. Dokumen ini bukan klaim bahwa seluruh integrasi eksternal sudah diuji atau aktif.

## 1. Ringkasan produk

StuntBot adalah aplikasi web berbasis Node.js dan Express untuk membantu petugas mencatat data antropometri balita. Aplikasi menyediakan halaman masuk/daftar, dashboard edukasi, formulir pencatatan, dan daftar maksimal sepuluh data terbaru. Server meneruskan data ke Google Apps Script, yang menulis dan membaca Google Sheets.

Aplikasi juga menyertakan beberapa file Google Apps Script untuk chatbot Telegram, pencarian data, konfigurasi, dan sesi. Namun, integrasi Telegram belum tersambung dengan alur Web App utama.

## 2. Pengguna dan tujuan

### Pengguna utama

- Kader Posyandu dan petugas yang mencatat pengukuran balita.
- Pengelola proyek yang meninjau data terbaru di Google Sheets.
- Pengunjung yang membaca informasi umum tentang stunting pada dashboard.

### Tujuan

- Memudahkan pengisian identitas dan pengukuran balita.
- Mengirim data melalui server aplikasi ke Google Apps Script.
- Menampilkan ringkasan dan daftar sepuluh catatan terbaru.
- Memberi informasi edukasi umum tentang stunting serta fungsi StuntBot.

## 3. Ruang lingkup fitur saat ini

### 3.1 Masuk dan daftar

Halaman utama berada di public/index.html. Pengguna dapat berpindah antara formulir Masuk dan Buat akun, menampilkan/menyembunyikan kata sandi, melihat indikator kekuatan kata sandi, dan memilih untuk mengingat email.

Implementasi akun berada sepenuhnya di browser. Satu objek akun disimpan pada localStorage dengan nama, email, dan kata sandi. Status masuk dicatat sebagai nilai stuntbot_logged. Halaman lain hanya memeriksa nilai tersebut di JavaScript; server tidak membuat sesi dan tidak melindungi route dengan autentikasi.

### 3.2 Dashboard

Halaman public/pages/home.html menyediakan:

- Pengantar penggunaan dashboard.
- Tautan menuju form input dan data terbaru.
- Bagian edukasi stunting.
- Bagian Tentang StuntBot.
- Navbar dengan ikon SVG, status menu aktif saat menggulir, menu ponsel, dan tombol Keluar.

Font antarmuka menggunakan DM Sans dan Manrope dari Google Fonts dengan fallback sistem.

### 3.3 Form input

Halaman public/pages/form.html menyediakan isian NIK, nama, jenis kelamin, nomor HP wali, tanggal lahir, tanggal pengukuran, panjang/tinggi, posisi ukur, dan kotak status stunting dari petugas.

Form memiliki validasi browser, hitung digit NIK, tanggal ukur awal, indikator pengiriman, pesan berhasil/gagal, dan tautan setelah penyimpanan berhasil. Status stunting berasal dari kotak pilihan petugas; kode tidak menghitung status menggunakan kurva antropometri.

### 3.4 Daftar data terbaru

Halaman public/pages/view.html:

- Memuat data melalui endpoint Node GET /api/records.
- Menampilkan paling banyak sepuluh catatan terbaru.
- Menyediakan pencarian berdasarkan nama, jenis kelamin, dan posisi ukur.
- Menyediakan filter untuk semua, ditandai, dan tidak ditandai.
- Menyediakan tombol muat ulang, indikator loading, keadaan kosong, dan pesan error.
- Tidak menampilkan NIK dan nomor HP pada tabel.

### 3.5 Pencatatan log

Setelah Apps Script menyatakan submit berhasil, controller menambahkan waktu UTC dan nama ke data.log. Log ini bukan sumber untuk halaman daftar data; daftar dibaca dari Google Sheets.

## 4. Alur utama

### Menyimpan catatan

1. Pengguna mengisi form dan browser memeriksa batasan input.
2. Browser mengirim JSON ke POST /submit pada server Express.
3. Model membuat bentuk data konsisten dan memvalidasi data.
4. Controller mengirim JSON ke SHEETS_ENDPOINT.
5. Google Apps Script menambahkan satu baris pada sheet HasilPendataan.
6. Setelah respons Apps Script berstatus ok, server menambahkan catatan ke data.log dan mengirim respons sukses ke browser.

### Membaca catatan

1. Halaman data meminta GET /api/records.
2. Controller Node menambahkan parameter view=1 ke SHEETS_ENDPOINT dan meneruskan permintaan.
3. Code.gs mengambil sepuluh baris terakhir dari sheet, membalik urutan menjadi terbaru dahulu, lalu mengembalikan JSON.
4. Halaman menerapkan pencarian/filter pada hasil tersebut dan menampilkan tabel.

## 5. Data dan validasi

### Payload form

| Field | Aturan model saat ini |
|---|---|
| nik | Wajib, tepat 16 digit |
| nama | Wajib, setelah spasi awal/akhir dibuang |
| jenis_kelamin | Wajib, L atau P |
| tanggal_lahir | Wajib, format tanggal YYYY-MM-DD yang valid |
| tanggal_ukur | Wajib, tanggal valid dan tidak sebelum tanggal lahir |
| tinggi_cm | Wajib, angka lebih dari 0 |
| posisi_ukur | Wajib, Berdiri atau Terlentang |
| hp | Wajib, 8–15 digit |
| isStunted | Boolean dari kotak pilihan; tidak dihitung oleh model |

### Kolom Google Sheets

Code.gs menulis sembilan kolom dengan urutan: NIK, Nama Lengkap, Jenis Kelamin, Tanggal Lahir, Tanggal Ukur, Tinggi (cm), Posisi Pengukuran, Nomor HP, dan Stunted? (TRUE/FALSE).

Endpoint daftar hanya mengirim nama, jenis kelamin, tanggal lahir, tanggal ukur, tinggi, posisi ukur, dan status. NIK serta nomor HP tidak disertakan dalam respons daftar.

## 6. API aplikasi

| Method | Path | Fungsi |
|---|---|---|
| GET | / | Menyajikan halaman login dari public/index.html |
| POST | /submit | Memvalidasi dan meneruskan data form ke Apps Script |
| GET | /api/records | Meminta sepuluh data terbaru dari Apps Script |
| GET | file di public | Menyajikan halaman dan aset statis |

Controller mengembalikan HTTP 400 untuk data tidak valid, 503 bila SHEETS_ENDPOINT tidak diatur, dan 502 bila integrasi Apps Script gagal.

## 7. Arsitektur dan konfigurasi

- app.js: server Express, middleware JSON/form, aset statis, dan route API.
- controllers/formController.js: validasi melalui model, komunikasi Apps Script, dan penulisan log lokal.
- models/childRecord.js: normalisasi dan validasi payload balita.
- public/: halaman HTML, logo SVG, CSS, dan komponen UI.
- Code.gs: Web App Google Apps Script untuk menulis dan membaca sheet.
- Config.gs, Sheets.gs, Session.gs, Chatbot.gs, Telegram.gs: modul Apps Script tambahan.
- .env: konfigurasi lokal, terutama PORT dan SHEETS_ENDPOINT.
- .env.example: contoh nama konfigurasi tanpa kredensial proyek.

Spreadsheet ID dan nama sheet untuk endpoint Code.gs saat ini ditulis langsung di source Code.gs. SHEETS_ENDPOINT harus menunjuk ke URL Web App Apps Script yang sesuai.

## 8. Batasan dan pekerjaan lanjutan yang tampak dari codebase

- Autentikasi berbasis localStorage bukan pengamanan server. Kata sandi akun disimpan di browser; API dan halaman statis tidak dilindungi server. Implementasi ini hanya cocok sebagai prototipe lokal, bukan perlindungan data kesehatan untuk penggunaan produksi.
- Aplikasi menerima status stunting dari kotak pilihan petugas. Belum ada perhitungan Z-score atau penilaian otomatis; informasi dashboard bukan diagnosis.
- Halaman data membatasi respons menjadi sepuluh catatan terakhir dan tidak menyediakan pagination atau pencarian seluruh riwayat.
- Apps Script perlu dideploy ulang setelah perubahan Code.gs agar endpoint terpasang menjalankan versi terbaru.
- File public/components berisi UI lama yang tidak digunakan navigasi utama dan beberapa tautannya tidak lengkap.
- Modul Telegram belum tersambung ke doPost utama. Chatbot.gs dan Telegram.gs merujuk CONFIG, sedangkan Config.gs menyediakan CHATBOT dan getConfig_; Sheets.gs juga merujuk CONFIG. Fungsi-fungsi tersebut perlu diselaraskan sebelum integrasi Telegram dapat dianggap siap.
- Dependensi body-parser tercantum di package.json, tetapi app.js kini menggunakan parser bawaan Express.

## 9. Kebutuhan kualitas UI yang diimplementasikan

- Layout form dan halaman data responsif untuk desktop dan ponsel.
- Loading, sukses, error, dan empty state disediakan untuk alur utama.
- Kontrol pencarian dan filter dapat digunakan tanpa memuat ulang halaman.
- Ikon dan logo disediakan dalam SVG.
- Font DM Sans dan Manrope dimuat dari Google Fonts; fallback sistem digunakan jika font eksternal tidak tersedia.
