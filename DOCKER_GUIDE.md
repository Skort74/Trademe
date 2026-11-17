# 🐳 Docker Setup Guide - TradeMe Backend

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Quick Start

### 1. Build dan Jalankan Containers
```bash
docker-compose up --build
```
### 2. Akses Aplikasi

Backend API: http://localhost:5001
Health Check: http://localhost:5001/api/health
Swagger UI: http://localhost:5001/apidocs
### 3. Stop Containers

```bash
docker-compose down
```
### 4. Stop dan Hapus Volume (Reset Database)

```bash
docker-compose down -v
```
Database Access

```bash
# Masuk ke MySQL container
docker exec -it trademe_db mysql -u trademe_user -p

# Password: trademe_password123
```
Logs

```bash
# Lihat semua logs
docker-compose logs -f

# Lihat log backend saja
docker-compose logs -f backend

# Lihat log database saja
docker-compose logs -f db
```
Environment Variables

Copy backend/.env.example ke backend/.env dan sesuaikan untuk konfigurasi lokal:

```bash
cp backend/.env.example backend/.env
```
Troubleshooting

Port Already in Use

Jika port 5001 atau 3306 sudah terpakai, edit docker-compose.yml dan ubah port mapping.
Database Connection Error

Tunggu beberapa detik hingga MySQL selesai initialize. Cek dengan:

```bash
docker-compose logs db
```
Rebuild After Code Changes

```bash
docker-compose up --build backend
```
Production Deployment

⚠️ Untuk production, GANTI semua password dan secret key di docker-compose.yml!

