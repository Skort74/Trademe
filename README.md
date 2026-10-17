# TradeMe Backend

Backend TradeMe merupakan layanan API berbasis Python Flask yang digunakan untuk menghubungkan aplikasi dengan database MySQL. Backend ini menggunakan MySQL Connector untuk komunikasi dengan database dan Flask-CORS agar API dapat diakses oleh frontend selama pengembangan.

## 1. Teknologi yang Digunakan

- Python
- Flask
- Flask-CORS
- MySQL Server
- MySQL Connector
- python-dotenv
- Git dan GitHub

## 2. Persiapan Awal

Sebelum menjalankan backend, pastikan perangkat sudah memiliki:

1. **Python** untuk menjalankan aplikasi backend.
2. **Git** untuk mengambil source code dari GitHub.
3. **MySQL Server** untuk menjalankan database.
4. **MySQL Workbench** untuk mengelola database secara visual (opsional, tetapi disarankan).
5. **Visual Studio Code** atau editor kode lainnya.

Pastikan MySQL Server sudah berjalan sebelum melanjutkan ke tahap konfigurasi database.

## 3. Mengambil Source Code dari GitHub

Buka Terminal, kemudian masuk ke direktori tempat project akan disimpan.

Clone repository:

```bash
git clone URL_REPOSITORY_KALIAN
```

Ganti `URL_REPOSITORY_KALIAN` dengan URL repository GitHub TradeMe.

Masuk ke folder repository:

```bash
cd NAMA_REPOSITORY
```

Pilih branch yang berisi source code backend:

```bash
git switch backend-belum-fix
```

> Jika source code backend sudah dipindahkan ke branch lain, sesuaikan nama branch dengan branch yang digunakan oleh tim.

Masuk ke folder backend:

```bash
cd backend
```

Pastikan file berikut tersedia:

```text
backend/
├── app.py
├── database.py
├── requirements.txt
├── .gitignore
└── routes/
```

Jika struktur folder berbeda, sesuaikan perintah berikutnya dengan lokasi file `app.py`.

## 4. Membuat Virtual Environment

Virtual environment digunakan agar dependencies Python untuk TradeMe terpisah dari instalasi Python global.

Buat virtual environment:

```bash
python3 -m venv .venv
```

Aktifkan virtual environment pada macOS/Linux:

```bash
source .venv/bin/activate
```

Jika berhasil, biasanya terminal akan menampilkan `(.venv)` pada awal baris.

Untuk Windows, gunakan:

```powershell
.venv\Scripts\activate
```

## 5. Menginstal Dependencies

Pastikan virtual environment sudah aktif dan Terminal berada di folder backend.

Jalankan:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

File `requirements.txt` berisi daftar library yang dibutuhkan backend. Jika file tersebut belum tersedia, instal library yang digunakan secara langsung:

```bash
pip install Flask Flask-Cors mysql-connector-python python-dotenv
```

Jika menggunakan perintah alternatif tersebut, buat file `requirements.txt` agar konfigurasi dependencies dapat dibagikan kepada anggota tim:

```bash
pip freeze > requirements.txt
```

## 6. Menyiapkan Database MySQL

Backend TradeMe menggunakan database bernama `trademe`.

### 6.1. Menjalankan MySQL Server

Pastikan MySQL Server sudah terinstal dan aktif. Kemudian buka MySQL Workbench dan hubungkan ke koneksi MySQL lokal.

### 6.2. Mengimpor Struktur Database

Minta file ekspor SQL database TradeMe kepada anggota tim yang mengelola database. File ini diperlukan untuk membuat tabel-tabel yang digunakan backend.

Jika menggunakan MySQL Workbench:

1. Buka MySQL Workbench.
2. Hubungkan ke MySQL Server lokal.
3. Pilih **Server → Data Import**.
4. Pilih **Import from Self-Contained File** jika file yang diberikan berupa satu file SQL.
5. Pilih file SQL database TradeMe.
6. Tentukan schema tujuan atau buat schema `trademe` sesuai isi file SQL.
7. Klik **Start Import**.
8. Setelah proses selesai, periksa bagian **Schemas** dan pastikan database `trademe` beserta tabel-tabelnya tersedia.

Jika file SQL hanya berisi struktur tabel, database belum memiliki data pengujian. Data dapat ditambahkan kemudian sesuai kebutuhan pengembangan.

> Gunakan file SQL terbaru dari tim agar struktur tabel pada perangkat masing-masing anggota tetap konsisten.

## 7. Mengatur Koneksi Database

Setiap anggota tim harus membuat file `.env` sendiri di dalam folder `backend`. File ini menyimpan konfigurasi koneksi database lokal.

Buat file bernama `.env`, lalu isi dengan format berikut:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=trademe
```

Sesuaikan nilai `DB_USER` dan `DB_PASSWORD` dengan akun MySQL lokal. Ganti `password_mysql_kamu` dengan password MySQL yang digunakan pada perangkat masing-masing.

Jika akun MySQL tidak menggunakan password, kosongkan nilainya setelah tanda `=`.

Pastikan nama database sesuai dengan schema yang telah diimpor.

**Penting:** File `.env` tidak boleh diunggah ke GitHub karena dapat berisi kredensial pribadi. Pastikan `.env` tercantum dalam file `.gitignore`.

## 8. Menjalankan Backend

Pastikan virtual environment aktif, MySQL Server berjalan, dan file `.env` sudah dikonfigurasi dengan benar.

Jalankan aplikasi:

```bash
python app.py
```

Backend akan berjalan pada port `5001` sesuai konfigurasi aplikasi saat ini.

Jika berhasil, Flask akan menampilkan alamat server lokal pada Terminal.

Jangan tutup Terminal selama backend masih digunakan.

## 9. Menguji Backend

Setelah server berjalan, buka browser dan akses endpoint berikut.

### 9.1. Endpoint Utama

```text
http://127.0.0.1:5001/
```

Endpoint ini digunakan untuk memastikan aplikasi Flask berjalan. Respons yang diharapkan:

```json
{
  "message": "TradeMe Backend API berjalan"
}
```

### 9.2. Endpoint Pemeriksaan Database

```text
http://127.0.0.1:5001/api/health
```

Jika koneksi database berhasil, respons yang diharapkan:

```json
{
  "status": "success",
  "database": "trademe",
  "message": "Koneksi database berhasil"
}
```

Jika respons menunjukkan error, periksa kembali apakah MySQL Server berjalan, nama database benar, dan kredensial pada file `.env` sesuai.

## 10. Menghentikan Backend

Untuk menghentikan server Flask, buka Terminal yang sedang menjalankan aplikasi dan tekan:

```text
Control + C
```

Untuk keluar dari virtual environment, jalankan:

```bash
deactivate
```

Saat ingin menjalankan backend kembali, masuk ke folder backend, aktifkan virtual environment, lalu jalankan `python app.py`.

## 11. Mengatasi Masalah Umum

### A. `ModuleNotFoundError`

Penyebab: library yang dibutuhkan belum terinstal atau virtual environment belum aktif.

Solusi:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### B. Koneksi database gagal

Penyebab yang mungkin:

- MySQL Server belum berjalan.
- Nama database tidak sesuai.
- Username atau password salah.
- File `.env` belum dibuat atau berada di lokasi yang salah.
- Port MySQL tidak sesuai.

Solusi: periksa kembali konfigurasi pada `.env`, lalu pastikan database `trademe` dapat diakses melalui MySQL Workbench.

### C. Port `5001` sudah digunakan

Penyebab: aplikasi lain sudah menggunakan port tersebut.

Solusi: tutup aplikasi yang menggunakan port itu atau ubah port pada bagian `app.run()` di `app.py`, kemudian gunakan port baru saat menguji endpoint.

### D. File `requirements.txt` tidak ditemukan

Pastikan Terminal berada di folder yang sama dengan file `requirements.txt`. Jika file belum dibuat, instal dependencies secara langsung sesuai bagian 5.

### E. Database `trademe` tidak ditemukan

Pastikan database sudah diimpor atau dibuat menggunakan file SQL dari tim. Periksa juga nilai `DB_NAME` pada file `.env`.

## 12. Catatan Pengembangan Tim

- Jangan mengunggah file `.env`, folder `.venv`, atau file cache Python ke GitHub.
- Setiap anggota tim menggunakan konfigurasi MySQL lokal masing-masing.
- Gunakan struktur database terbaru yang disepakati tim.
- Sebelum melakukan commit, periksa perubahan dengan `git status`.
- Koordinasikan perubahan struktur database agar tidak terjadi perbedaan skema antaranggotanya.

## 13. Status Backend Saat Ini

Backend awal TradeMe menyediakan endpoint utama untuk memeriksa apakah aplikasi Flask berjalan dan endpoint kesehatan untuk memeriksa koneksi ke database MySQL.

Fitur API lainnya, seperti pengelolaan barang, transaksi, pembayaran, chat, donasi, dan lelang, perlu diimplementasikan sesuai pembagian tugas pengembangan.

---

**TradeMe Development Team**
