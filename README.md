# StuntBot

StuntBot adalah aplikasi web pemantauan pertumbuhan anak. Petugas admin dapat memasukkan data pemeriksaan dan mengatur jadwal pemeriksaan di puskesmas. Pengguna dapat melihat data pemeriksaan dan jadwal yang tersedia.

## Fitur

- Login admin menggunakan kredensial dari environment (`.env`).
- Pengguna membuat akun dengan nama, Gmail, kata sandi, dan nomor HP; login mencocokkan Gmail, kata sandi, serta nomor HP.
- Login pengguna hanya diaktifkan setelah admin menyetujui nomor HP melalui tombol penghubungan Telegram.
- Dashboard admin untuk membuka data pemeriksaan, menginput data, serta menambah dan menghapus jadwal.
- Form data balita divalidasi di server dan dikirim ke Google Apps Script untuk disimpan di Google Sheets.
- Pengguna dapat melihat data terbaru dan jadwal dari halaman dashboard. Form pengiriman data hanya menerima sesi admin.
- Jadwal ditampilkan di kartu yang berdampingan dengan kartu data terbaru pada dashboard.
- Halaman edukasi ringkas tentang stunting.

## Persyaratan

- Node.js 20 atau lebih baru.
- npm.
- Google Apps Script Web App yang mendukung pembacaan dan penyimpanan data sesuai source `Code.gs`.
- Google Sheets yang dapat diakses oleh Apps Script.

## Menjalankan aplikasi

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Salin `.env.example` menjadi `.env`.
3. Isi konfigurasi `.env`:

   ```dotenv
   PORT=3000
   SHEETS_ENDPOINT=https://script.google.com/macros/s/ID_DEPLOYMENT_ANDA/exec
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=ganti-dengan-kata-sandi-kuat
   ```

   Ganti `SHEETS_ENDPOINT` dengan URL deployment Google Apps Script milik Anda. Atur kata sandi admin yang kuat dan jangan masukkan `.env` ke Git.

4. Jalankan server:

   ```bash
   npm start
   ```

5. Buka `http://localhost:3000` untuk halaman pengguna atau `http://localhost:3000/pages/admin.html` untuk login admin.

Jika kode Apps Script berubah, deploy versi baru Web App dan pastikan akses spreadsheet sudah sesuai.

## Halaman dan endpoint

| URL | Fungsi |
| --- | --- |
| `/` | Halaman masuk pengguna |
| `/pages/home.html` | Dashboard pengguna, data terbaru, dan jadwal pemeriksaan |
| `/pages/view.html` | Daftar maksimal 10 data terbaru, pencarian, dan filter |
| `/pages/admin.html` | Login dan dashboard admin |
| `/pages/form.html` | Form input data pemeriksaan; pengiriman wajib menggunakan sesi admin |
| `POST /api/admin/login` | Login admin dan membuat sesi |
| `POST /api/admin/logout` | Mengakhiri sesi admin |
| `POST /api/user/register` | Membuat akun pengguna dengan nama, Gmail, kata sandi, dan nomor HP |
| `POST /api/user/login` | Masuk menggunakan Gmail, kata sandi, dan nomor HP yang disetujui admin |
| `GET /api/user/session` | Memeriksa sesi pengguna aktif |
| `POST /api/user/logout` | Mengakhiri sesi pengguna |
| `POST /submit` | Validasi dan pengiriman data ke Google Apps Script; khusus admin |
| `GET /api/records` | Mengambil data dari Google Apps Script untuk ditampilkan |
| `GET /api/schedules` | Mengambil jadwal untuk dashboard pengguna |
| `GET /api/admin/schedules` | Melihat jadwal dari dashboard admin |
| `POST /api/admin/schedules` | Menambahkan jadwal; khusus admin |
| `DELETE /api/admin/schedules/:id` | Menghapus jadwal; khusus admin |
| `POST /api/telegram/status` | Memeriksa status Telegram untuk nomor pada sesi pengguna |

## Penyimpanan data

- Data pemeriksaan disimpan melalui Google Apps Script ke Google Sheets. Alamat endpoint diatur melalui `SHEETS_ENDPOINT`.
- Akun pengguna disimpan dalam `users.json`; kata sandi disimpan sebagai hash, bukan teks biasa. File ini diabaikan oleh Git.
- Jadwal pemeriksaan disimpan dalam `schedules.json` di direktori proyek. File ini dibuat saat jadwal pertama disimpan dan tidak dilacak Git.
- Log pengiriman data ditulis ke `data.log`.

## Validasi data

Server memvalidasi NIK 16 digit, nama, jenis kelamin (`L` atau `P`), tanggal lahir dan ukur, tinggi badan lebih dari nol, posisi ukur (`Berdiri` atau `Terlentang`), serta nomor HP 8–15 digit. Status stunting diisi oleh petugas; aplikasi tidak menghitung diagnosis.

Jadwal harus berisi tanggal valid, waktu format `JJ:MM`, dan nama puskesmas. Lokasi dan catatan bersifat opsional.

## Struktur proyek

- `app.js` — server Express, sesi admin, dan endpoint aplikasi.
- `controllers/formController.js` — integrasi baca/tulis data dengan Google Apps Script.
- `models/childRecord.js` — validasi data pemeriksaan.
- `models/schedule.js` — penyimpanan dan validasi jadwal.
- `public/index.html` — halaman masuk pengguna.
- `public/pages/` — halaman dashboard, data, form, dan admin.
- `public/assets/` — aset visual aplikasi.
- `Code.gs`, `Sheets.gs`, `Config.gs`, `Session.gs`, `Chatbot.gs`, `Telegram.gs` — kode Google Apps Script.

Untuk mengaktifkan integrasi Telegram:

1. Simpan token bot pada Apps Script → Project Settings → Script Properties dengan nama TELEGRAM_TOKEN. Jangan simpan token di Config.gs.
2. Simpan URL Web App produksi dari Manage deployments sebagai Script Property WEB_APP_URL. URL harus berakhir /exec (jangan gunakan URL Test deployments yang berakhir /dev).
3. Pastikan Code.gs, Config.gs, Sheets.gs, Session.gs, Telegram.gs, dan Chatbot.gs versi terbaru ada di project Apps Script yang sama.
4. Deploy sebagai Web app, jalankan sebagai pemilik project, lalu isi SHEETS_ENDPOINT pada server dengan URL deployment yang berakhir /exec.
5. Jalankan fungsi setupTelegramWebhook satu kali dari editor Apps Script setelah deployment dibuat atau diperbarui.
6. Jika bot tidak membalas /start, jalankan diagnoseTelegramWebhook dari dropdown fungsi dan lihat pendingUpdateCount serta lastErrorMessage pada Execution log. URL webhook tidak dicetak agar key tetap tersembunyi.
7. Admin masuk ke dashboard, masukkan nomor HP, lalu tekan Hubungkan dengan bot. Pengguna masuk dengan akun yang memakai nomor HP yang sama. Setelah admin membuat pairing, tombol Telegram akan membuka tautan pairing selama 10 menit.
8. Di Telegram, pengguna menekan Start dan Bagikan nomor HP saya. Telegram memerlukan konfirmasi ini untuk memastikan nomor yang dibagikan adalah milik pengguna. Setelah nomor cocok, bot menghubungkan akun dan tombol berubah menjadi Chat StuntBot.

Jika muncul pesan NIK pada bagian Telegram, deployment aktif masih memakai versi lama. Buat New version pada Manage deployments dan pastikan SHEETS_ENDPOINT server menunjuk ke deployment yang sama. Sesi login pengguna berlaku 12 jam. Pastikan hosting menyediakan penyimpanan file persisten untuk `users.json`; jika file tersebut hilang, akun pengguna perlu didaftarkan kembali.

## Catatan keamanan

- Sesi admin berlaku 8 jam dan disimpan di memori server; sesi akan berakhir jika server dimulai ulang. Gunakan HTTPS saat aplikasi dipasang di lingkungan produksi.
- Jangan membagikan kredensial admin atau menyimpan file `.env` di repository.
- Aplikasi ini membantu pencatatan dan pemantauan, bukan pengganti penilaian tenaga kesehatan.



