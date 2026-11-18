# StuntBot Web App – Pemantauan Stunting

## Deskripsi
Aplikasi web **single‑page** sederhana berbasis **Node.js + Express** dengan struktur **MVC** yang rapi:
- `models/` – tempat model (kosong untuk contoh ini).
- `controllers/` – logika pengolahan form dan pencatatan log.
- `views/` – file HTML statis di `public/`.
- `app.js` – konfigurasi server.

Pengguna dapat mengisi data antropometri balita melalui form. Setelah data berhasil disubmit, server menuliskan baris log ke file `data.log` dengan format:
```
2026-11-18T12:00:00.123Z - data (Nama Lengkap) berhasil dimasukkan
```
Pesan ini juga dikirim kembali ke browser sebagai notifikasi keberhasilan.

## Prasyarat
- Windows 10/11 (atau Linux/macOS) dengan **Node.js ≥ 20** terinstal.
- `npm` (disertakan bersama Node).

## Instalasi
```powershell
# 1. Buka terminal di folder proyek
cd "c:\Users\TUGAS\sistem terdistribusi\StuntBot"

# 2. Install dependensi
npm install
```

## Menjalankan Server
```powershell
npm start
```
Server akan mendengarkan pada port **3000** (atau pada variabel lingkungan `PORT`).

## Mengakses dari Perangkat Lain
1. Cari alamat IP laptop Anda (mis. `ipconfig` → `IPv4 Address`).
2. Pada perangkat lain di jaringan yang sama, buka browser dan kunjungi:
```
http://<ALAMAT_IP_LAPTOP>:3000
```
> **Catatan:** Pastikan firewall Windows mengizinkan koneksi masuk pada port 3000 atau non‑aktifkan firewall untuk jaringan lokal.

## Struktur Direktori
```
StuntBot/
├─ app.js                # Entry point, routing
├─ package.json
├─ data.log              # Log hasil input (otomatis dibuat)
├─ controllers/
│   └─ formController.js
├─ models/
│   └─ index.js          # placeholder
├─ public/
│   └─ index.html        # UI form dengan Tailwind CSS
└─ README.md             # (ini)
```

## Cara Kerja
1. Pengguna membuka `/` → halaman `index.html` menampilkan form.
2. Saat menekan **Simpan**, JavaScript mengirimkan data via **Fetch API** (`POST /submit`).
3. `formController.handleSubmit` menulis log ke `data.log` dan mengembalikan JSON `{ success: true, message: 'Data berhasil disimpan' }`.
4. UI menampilkan notifikasi sukses atau error sesuai respons.

## Pengembangan Selanjutnya
- Tambahkan validasi sisi server.
- Integrasikan dengan Google Apps Script atau Google Sheets untuk penyimpanan terpusat.
- Tambahkan autentikasi (mis. JWT) bila diperlukan.

---
*Dibuat dengan Antigravity – struktur MVC sederhana, mudah dikelola, dan tidak terlihat “AI‑generated”.*