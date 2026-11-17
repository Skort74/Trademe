-- =============================================================================
-- Migration: Revisi Fitur Donasi
-- 1. Tabel yayasan_mitra
-- 2. Relasi yayasan_id pada tabel donasi
-- 3. Kolom tipe_pemohon & lokasi pada tabel pengajuan_donasi
-- =============================================================================

CREATE TABLE IF NOT EXISTS `yayasan_mitra` (
  `yayasan_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nama_yayasan` VARCHAR(150) NOT NULL,
  `deskripsi` TEXT,
  `alamat` TEXT,
  `kontak` VARCHAR(50),
  `logo` VARCHAR(255) DEFAULT NULL,
  `status_aktif` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Modifikasi tabel donasi
ALTER TABLE `donasi`
  ADD COLUMN `yayasan_id` INT DEFAULT NULL;

ALTER TABLE `donasi`
  ADD CONSTRAINT `fk_donasi_yayasan` 
  FOREIGN KEY (`yayasan_id`) REFERENCES `yayasan_mitra` (`yayasan_id`) 
  ON DELETE SET NULL;

-- Modifikasi tabel pengajuan_donasi
ALTER TABLE `pengajuan_donasi`
  ADD COLUMN `tipe_pemohon` ENUM('perorangan', 'yayasan') NOT NULL DEFAULT 'perorangan',
  ADD COLUMN `lokasi` VARCHAR(255) DEFAULT NULL;

