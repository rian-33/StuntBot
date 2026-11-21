# StuntBot

Aplikasi web Node.js dan Express untuk mencatat data antropometri balita ke Google Sheets melalui Google Apps Script. Dashboard juga menyediakan edukasi ringkas tentang stunting dan halaman data terbaru.

## Fitur saat ini

- Halaman masuk dan daftar pada halaman utama.
- Dashboard dengan navigasi SVG, bagian edukasi stunting, dan Tentang StuntBot.
- Form input data balita dengan validasi browser dan server.
- Pengiriman data melalui Express ke Google Apps Script.
- Daftar maksimum 10 catatan terbaru dari Google Sheets, dengan pencarian, filter status, dan muat ulang.
- Pencatatan hasil submit ke data.log.

## Persyaratan

- Node.js 20 atau lebih baru.
- npm.
- Google Apps Script Web App dengan handler doPost dan doGet sesuai source Code.gs.
- Google Sheets yang dapat diakses oleh Apps Script.

## Menjalankan aplikasi

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Salin .env.example menjadi .env.
3. Atur PORT dan SHEETS_ENDPOINT. SHEETS_ENDPOINT harus berupa URL deployment Google Apps Script yang digunakan proyek.
4. Jalankan server:

   ```bash
   npm start
   ```

5. Buka http://localhost:3000.

Setelah mengubah Code.gs, deploy versi baru Google Apps Script agar perubahan endpoint baca/tulis aktif. Pastikan deployment dan akses spreadsheet telah dikonfigurasi.

## Halaman dan endpoint

- / menyajikan halaman masuk/daftar.
- /pages/home.html adalah dashboard.
- /pages/form.html adalah form pencatatan.
- /pages/view.html menampilkan maksimal 10 data terbaru.
- POST /submit memvalidasi lalu meneruskan data ke Apps Script.
- GET /api/records mengambil data terbaru dari Apps Script.
- Aset statis dilayani dari folder public.

## Validasi form

Server memeriksa NIK 16 digit, nama, jenis kelamin L/P, tanggal yang valid, tanggal ukur tidak lebih awal dari tanggal lahir, tinggi di atas nol, posisi Berdiri/Terlentang, dan nomor HP 8–15 digit. Kotak status stunting adalah nilai dari petugas; aplikasi tidak menghitung status tersebut.

## Struktur proyek

- app.js — server Express dan route.
- controllers/formController.js — alur submit, baca daftar, integrasi Apps Script, log.
- models/childRecord.js — normalisasi dan validasi record.
- public/index.html — halaman masuk dan daftar.
- public/pages/ — dashboard, form, daftar data, dan redirect login.
- public/assets/stuntbot-logo.svg — logo.
- public/components/ dan public/css/ — aset UI lama/alternatif yang belum menjadi bagian dari navigasi utama.
- Code.gs — endpoint Google Apps Script untuk menulis dan membaca data.
- Config.gs, Sheets.gs, Session.gs, Chatbot.gs, Telegram.gs — modul Apps Script tambahan; integrasi Telegram belum tersambung pada endpoint utama.
- prd_web_stunting.md — PRD hasil reverse engineering codebase.

## Catatan konfigurasi dan keamanan

Akun login/daftar saat ini disimpan di localStorage browser dan halaman hanya melakukan pemeriksaan status di sisi client. Ini bukan autentikasi yang aman untuk melindungi data kesehatan dan tidak boleh dianggap sebagai kontrol akses produksi.

Jangan masukkan file .env atau data sensitif ke repository. ID spreadsheet pada Code.gs saat ini ditulis langsung di source dan perlu disesuaikan dengan lingkungan deployment.

