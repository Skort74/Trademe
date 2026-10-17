# TradeMe Backend

Backend aplikasi TradeMe menggunakan Flask dan MySQL.

## Teknologi
- Python
- Flask
- Flask-CORS
- MySQL
- mysql-connector-python
- python-dotenv

## Persiapan
1. Pastikan Python dan MySQL sudah terpasang.
2. Clone repository dan pindah ke folder backend.
3. Buat virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
4. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
5. Buat file `.env` berdasarkan konfigurasi database lokal:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password_mysql_kamu
   DB_NAME=trademe
   ```
6. Impor struktur database `trademe` melalui MySQL Workbench.

## Menjalankan Backend
Jalankan:
```bash
python app.py
```

Server berjalan pada:
`http://127.0.0.1:5001`

## Endpoint Dasar
- `GET /` — memeriksa server Flask.
- `GET /api/health` — memeriksa koneksi database.

## Catatan
Jangan mengunggah file `.env`, password database, atau folder `venv` ke GitHub. Setiap pengembang harus mengatur `.env` sesuai konfigurasi MySQL di komputernya masing-masing.