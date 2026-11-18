# Product Requirements Document (PRD): Web App Pemantauan Stunting

## 1. Pendahuluan

**Tujuan Produk:** Membangun aplikasi berbasis web yang responsif sebagai antarmuka utama (klien _front-end_) untuk memasukkan data antropometri balita. Data dari web ini akan terintegrasi langsung dengan Google Sheets (sebagai basis data) melalui _middleware_ Google Apps Script, dan terhubung dengan Bot Telegram untuk kemudahan akses baca dan perbarui data secara _real-time_.

## 2. Pengguna Sasaran

Kader Posyandu dan Petugas Gizi Puskesmas yang memiliki mobilitas tinggi dan membutuhkan alat input data yang cepat, stabil, serta dapat diakses dari peramban (_browser_) perangkat seluler maupun komputer dasar.

## 3. Arsitektur Teknis Web

- **Teknologi Utama:** HTML, CSS (direkomendasikan menggunakan _framework_ Tailwind CSS atau Bootstrap untuk mempercepat pembuatan desain responsif), dan JavaScript murni (_Vanilla JS_).
- **Metode Komunikasi Jaringan:** Web tidak memiliki peladen _backend_ sendiri, melainkan berkomunikasi langsung dengan titik akhir URL (_endpoint_) _Web App_ Google Apps Script menggunakan antarmuka modern `Fetch API`.

## 4. Kebutuhan Fungsional (Functional Requirements)

### 4.1. Formulir Input Data Antropometri

Antarmuka web harus menyediakan formulir yang berfokus pada pengalaman pengguna yang cepat, dengan rincian _input_ berikut untuk mematuhi pedoman pengukuran Kemenkes RI:

- **NIK Balita:** Bidang teks bernomor (16 digit angka).
- **Nama Lengkap:** Bidang teks biasa.
- **Jenis Kelamin:** Pilihan tombol radio (Laki-laki / Perempuan).
- **Tanggal Lahir:** Bidang _Date picker_ standar HTML5.
- **Tanggal Ukur:** Bidang _Date picker_ (secara otomatis diisi dengan tanggal hari ini).
- **Tinggi/Panjang Badan:** Bidang masukan angka desimal dengan ketelitian hingga 0,1 cm.
- **Posisi Pengukuran:** Pilihan _dropdown_ atau tombol radio (Berdiri / Terlentang).

### 4.2. Pengiriman Asinkron & Manajemen CORS

- **Tanpa Muat Ulang (_No Reload_):** Saat pengguna mengeklik kirim, eksekusi standar peramban harus dihentikan dan data dikirimkan di latar belakang secara asinkron (pendekatan _Single Page Application_).
- **Penanganan CORS Lintas Domain:** Untuk menghindari pemblokiran Kebijakan Asal Sama (_CORS preflight error_) dari sistem keamanan peramban terhadap URL Google Apps Script, fungsi JavaScript harus mengemas data objek menjadi format teks biasa. _Fetch_ harus dideklarasikan dengan parameter metode `POST` dan _header_ yang dikonfigurasi sebagai `Content-Type: text/plain;charset=utf-8` alih-alih tipe standar JSON.

### 4.3. Manajemen Siklus Antarmuka Pengguna (UI States)

Aplikasi web tidak boleh membiarkan pengguna kebingungan saat menunggu proses. Web harus menangani tiga kondisi mutlak dengan umpan balik visual yang jelas:

- **Loading State (Fase Memuat):** Tepat setelah tombol "Simpan" diklik, tombol tersebut harus dinonaktifkan (_disabled_) dan memunculkan indikator animasi (_spinner_) untuk mencegah pengguna menekan tombol berulang kali yang berpotensi menghasilkan data ganda.
- **Success State (Fase Sukses):** Jika instruksi _fetch_ berhasil dan peladen mengembalikan status jaringan yang baik, kosongkan isian formulir dan tampilkan notifikasi keberhasilan di layar.
- **Error State (Fase Galat):** Seluruh panggilan jaringan harus dibungkus dalam blok `try...catch`. Jika terjadi koneksi terputus atau galat dari peladen pelaporan, blok tangkapan (_catch_) wajib diaktifkan. Tombol simpan harus diaktifkan kembali dan sistem harus menampilkan pesan peringatan (misalnya: "Gagal menyimpan data, periksa koneksi Anda") dengan mempertahankan nilai yang sudah telanjur diketik oleh pengguna agar dapat segera dicoba lagi.

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

- **Responsivitas Perangkat:** Tata letak layar harus elastis; dapat dibaca dengan jelas di layar ponsel saat kader berada di lapangan, sekaligus terlihat proporsional jika dibuka pada laptop puskesmas.
- **Beban Komputasi Ringan (_Thin Client_):** Web HTML ini hanya bertugas mengumpulkan data mentah. Semua perhitungan analitik (seperti pencarian usia berdasarkan hitungan bulan penuh, pengurangan koreksi posisi ukur, dan kalkulasi algoritmik _Z-Score_ ke tabel acuan WHO) sama sekali tidak boleh diproses di JavaScript web, melainkan dipusatkan (_centralized_) pada ekosistem _middleware_ Google Apps Script.

## 6. Referensi Skema Payload Data

Sebagai panduan untuk _programmer_ dalam menyusun fungsi asinkron ke URL web aplikasi (_endpoint_), berikut adalah representasi objek mentah yang nantinya akan dikonversi menggunakan JSON.stringify sebelum ditembakkan lewat _fetch_:

```json
{
  "nik": "1234567890123456",
  "nama": "Ahmad",
  "jenis_kelamin": "L",
  "tanggal_lahir": "2024-05-10",
  "waktu_ukur": "2026-11-17",
  "tinggi_cm": 83.5,
  "posisi_ukur": "Terlentang"
}
```
