# Product Requirements Document (PRD): Web App Pemantauan Stunting

## 1. Pendahuluan
**Tujuan Produk:** Membangun aplikasi berbasis web yang responsif sebagai antarmuka utama (klien *front-end*) untuk memasukkan data antropometri balita. Data dari web ini akan terintegrasi langsung dengan Google Sheets (sebagai basis data) melalui *middleware* Google Apps Script, dan terhubung dengan Bot Telegram untuk kemudahan akses baca dan perbarui data secara *real-time*.

## 2. Pengguna Sasaran
Kader Posyandu dan Petugas Gizi Puskesmas yang memiliki mobilitas tinggi dan membutuhkan alat input data yang cepat, stabil, serta dapat diakses dari peramban (*browser*) perangkat seluler maupun komputer dasar.

## 3. Arsitektur Teknis Web
*   **Teknologi Utama:** HTML, CSS (direkomendasikan menggunakan *framework* Tailwind CSS atau Bootstrap untuk mempercepat pembuatan desain responsif), dan JavaScript murni (*Vanilla JS*).
*   **Metode Komunikasi Jaringan:** Web tidak memiliki peladen *backend* sendiri, melainkan berkomunikasi langsung dengan titik akhir URL (*endpoint*) *Web App* Google Apps Script menggunakan antarmuka modern `Fetch API`.

## 4. Kebutuhan Fungsional (Functional Requirements)
### 4.1. Formulir Input Data Antropometri
Antarmuka web harus menyediakan formulir yang berfokus pada pengalaman pengguna yang cepat, dengan rincian *input* berikut untuk mematuhi pedoman pengukuran Kemenkes RI:
*   **NIK Balita:** Bidang teks bernomor (16 digit angka).
*   **Nama Lengkap:** Bidang teks biasa.
*   **Jenis Kelamin:** Pilihan tombol radio (Laki-laki / Perempuan).
*   **Tanggal Lahir:** Bidang *Date picker* standar HTML5.
*   **Tanggal Ukur:** Bidang *Date picker* (secara otomatis diisi dengan tanggal hari ini).
*   **Tinggi/Panjang Badan:** Bidang masukan angka desimal dengan ketelitian hingga 0,1 cm.
*   **Posisi Pengukuran:** Pilihan *dropdown* atau tombol radio (Berdiri / Terlentang).

### 4.2. Pengiriman Asinkron & Manajemen CORS
*   **Tanpa Muat Ulang (*No Reload*):** Saat pengguna mengeklik kirim, eksekusi standar peramban harus dihentikan dan data dikirimkan di latar belakang secara asinkron (pendekatan *Single Page Application*).
*   **Penanganan CORS Lintas Domain:** Untuk menghindari pemblokiran Kebijakan Asal Sama (*CORS preflight error*) dari sistem keamanan peramban terhadap URL Google Apps Script, fungsi JavaScript harus mengemas data objek menjadi format teks biasa. *Fetch* harus dideklarasikan dengan parameter metode `POST` dan *header* yang dikonfigurasi sebagai `Content-Type: text/plain;charset=utf-8` alih-alih tipe standar JSON.

### 4.3. Manajemen Siklus Antarmuka Pengguna (UI States)
Aplikasi web tidak boleh membiarkan pengguna kebingungan saat menunggu proses. Web harus menangani tiga kondisi mutlak dengan umpan balik visual yang jelas:
*   **Loading State (Fase Memuat):** Tepat setelah tombol "Simpan" diklik, tombol tersebut harus dinonaktifkan (*disabled*) dan memunculkan indikator animasi (*spinner*) untuk mencegah pengguna menekan tombol berulang kali yang berpotensi menghasilkan data ganda.
*   **Success State (Fase Sukses):** Jika instruksi *fetch* berhasil dan peladen mengembalikan status jaringan yang baik, kosongkan isian formulir dan tampilkan notifikasi keberhasilan di layar.
*   **Error State (Fase Galat):** Seluruh panggilan jaringan harus dibungkus dalam blok `try...catch`. Jika terjadi koneksi terputus atau galat dari peladen pelaporan, blok tangkapan (*catch*) wajib diaktifkan. Tombol simpan harus diaktifkan kembali dan sistem harus menampilkan pesan peringatan (misalnya: "Gagal menyimpan data, periksa koneksi Anda") dengan mempertahankan nilai yang sudah telanjur diketik oleh pengguna agar dapat segera dicoba lagi.

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)
*   **Responsivitas Perangkat:** Tata letak layar harus elastis; dapat dibaca dengan jelas di layar ponsel saat kader berada di lapangan, sekaligus terlihat proporsional jika dibuka pada laptop puskesmas.
*   **Beban Komputasi Ringan (*Thin Client*):** Web HTML ini hanya bertugas mengumpulkan data mentah. Semua perhitungan analitik (seperti pencarian usia berdasarkan hitungan bulan penuh, pengurangan koreksi posisi ukur, dan kalkulasi algoritmik *Z-Score* ke tabel acuan WHO) sama sekali tidak boleh diproses di JavaScript web, melainkan dipusatkan (*centralized*) pada ekosistem *middleware* Google Apps Script.

## 6. Referensi Skema Payload Data
Sebagai panduan untuk *programmer* dalam menyusun fungsi asinkron ke URL web aplikasi (*endpoint*), berikut adalah representasi objek mentah yang nantinya akan dikonversi menggunakan JSON.stringify sebelum ditembakkan lewat *fetch*:

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