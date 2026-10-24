-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: localhost    Database: trademe
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `nama_admin` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'Admin TradeMe','admin@trademe.com','admin123');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barang`
--

DROP TABLE IF EXISTS `barang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barang` (
  `barang_id` int NOT NULL AUTO_INCREMENT,
  `pemilik_id` int NOT NULL,
  `kategori_id` int NOT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `deskripsi` text,
  `kondisi` varchar(50) DEFAULT NULL,
  `harga` decimal(15,2) DEFAULT NULL,
  `lokasi` varchar(255) DEFAULT NULL,
  `foto_barang` varchar(255) DEFAULT NULL,
  `tipe_transaksi` enum('jual','tukar','donasi','lelang') NOT NULL,
  `status_barang` enum('pending','tersedia','terjual','didonasikan','dilelang') NOT NULL DEFAULT 'pending',
  `status_verifikasi` enum('pending','disetujui','ditolak') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`barang_id`),
  KEY `fk_barang_user` (`pemilik_id`),
  KEY `fk_barang_kategori` (`kategori_id`),
  CONSTRAINT `fk_barang_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`kategori_id`),
  CONSTRAINT `fk_barang_user` FOREIGN KEY (`pemilik_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barang`
--

LOCK TABLES `barang` WRITE;
/*!40000 ALTER TABLE `barang` DISABLE KEYS */;
INSERT INTO `barang` VALUES (1,1,1,'Laptop Bekas','Laptop masih berfungsi dengan baik','Bekas - Baik',4500000.00,'Surabaya',NULL,'jual','tersedia','disetujui');
/*!40000 ALTER TABLE `barang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat` (
  `chat_id` int NOT NULL AUTO_INCREMENT,
  `pengirim_id` int NOT NULL,
  `penerima_id` int NOT NULL,
  `pesan` text NOT NULL,
  `waktu_kirim` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chat_id`),
  KEY `fk_chat_pengirim` (`pengirim_id`),
  KEY `fk_chat_penerima` (`penerima_id`),
  CONSTRAINT `fk_chat_penerima` FOREIGN KEY (`penerima_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_chat_pengirim` FOREIGN KEY (`pengirim_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat`
--

LOCK TABLES `chat` WRITE;
/*!40000 ALTER TABLE `chat` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donasi`
--

DROP TABLE IF EXISTS `donasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donasi` (
  `donasi_id` int NOT NULL AUTO_INCREMENT,
  `barang_id` int NOT NULL,
  `donor_id` int NOT NULL,
  `penerima_id` int DEFAULT NULL,
  `pengajuan_id` int DEFAULT NULL,
  `status_verifikasi` enum('pending','disetujui','ditolak') NOT NULL DEFAULT 'pending',
  `status_donasi` enum('tersedia','diproses','disalurkan','selesai') NOT NULL DEFAULT 'tersedia',
  PRIMARY KEY (`donasi_id`),
  KEY `fk_donasi_barang` (`barang_id`),
  KEY `fk_donasi_donor` (`donor_id`),
  KEY `fk_donasi_penerima` (`penerima_id`),
  KEY `fk_donasi_pengajuan` (`pengajuan_id`),
  CONSTRAINT `fk_donasi_barang` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`barang_id`),
  CONSTRAINT `fk_donasi_donor` FOREIGN KEY (`donor_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_donasi_penerima` FOREIGN KEY (`penerima_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_donasi_pengajuan` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan_donasi` (`pengajuan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donasi`
--

LOCK TABLES `donasi` WRITE;
/*!40000 ALTER TABLE `donasi` DISABLE KEYS */;
/*!40000 ALTER TABLE `donasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori`
--

DROP TABLE IF EXISTS `kategori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategori` (
  `kategori_id` int NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(100) NOT NULL,
  PRIMARY KEY (`kategori_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori`
--

LOCK TABLES `kategori` WRITE;
/*!40000 ALTER TABLE `kategori` DISABLE KEYS */;
INSERT INTO `kategori` VALUES (1,'Elektronik'),(2,'Fashion'),(3,'Furniture'),(4,'Buku'),(5,'Olahraga'),(6,'Lainnya');
/*!40000 ALTER TABLE `kategori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lelang`
--

DROP TABLE IF EXISTS `lelang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lelang` (
  `lelang_id` int NOT NULL AUTO_INCREMENT,
  `barang_id` int NOT NULL,
  `penjual_id` int NOT NULL,
  `harga_awal` decimal(15,2) NOT NULL,
  `harga_tertinggi` decimal(15,2) DEFAULT NULL,
  `waktu_mulai` datetime NOT NULL,
  `waktu_selesai` datetime NOT NULL,
  `pemenang_id` int DEFAULT NULL,
  `status_lelang` enum('pending','berlangsung','selesai','dibatalkan') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`lelang_id`),
  KEY `fk_lelang_barang` (`barang_id`),
  KEY `fk_lelang_penjual` (`penjual_id`),
  KEY `fk_lelang_pemenang` (`pemenang_id`),
  CONSTRAINT `fk_lelang_barang` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`barang_id`),
  CONSTRAINT `fk_lelang_pemenang` FOREIGN KEY (`pemenang_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_lelang_penjual` FOREIGN KEY (`penjual_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lelang`
--

LOCK TABLES `lelang` WRITE;
/*!40000 ALTER TABLE `lelang` DISABLE KEYS */;
/*!40000 ALTER TABLE `lelang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `negosiasi`
--

DROP TABLE IF EXISTS `negosiasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `negosiasi` (
  `negosiasi_id` int NOT NULL AUTO_INCREMENT,
  `barang_id` int NOT NULL,
  `penjual_id` int NOT NULL,
  `pembeli_id` int NOT NULL,
  `harga_awal` decimal(15,2) NOT NULL,
  `harga_tawaran` decimal(15,2) NOT NULL,
  `status_negosiasi` enum('pending','diterima','ditolak','dibatalkan') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`negosiasi_id`),
  KEY `fk_negosiasi_barang` (`barang_id`),
  KEY `fk_negosiasi_penjual` (`penjual_id`),
  KEY `fk_negosiasi_pembeli` (`pembeli_id`),
  CONSTRAINT `fk_negosiasi_barang` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`barang_id`),
  CONSTRAINT `fk_negosiasi_pembeli` FOREIGN KEY (`pembeli_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_negosiasi_penjual` FOREIGN KEY (`penjual_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `negosiasi`
--

LOCK TABLES `negosiasi` WRITE;
/*!40000 ALTER TABLE `negosiasi` DISABLE KEYS */;
/*!40000 ALTER TABLE `negosiasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pembayaran`
--

DROP TABLE IF EXISTS `pembayaran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pembayaran` (
  `pembayaran_id` int NOT NULL AUTO_INCREMENT,
  `transaksi_id` int NOT NULL,
  `jumlah` decimal(15,2) NOT NULL,
  `metode_pembayaran` enum('COD','Transfer') NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status_verifikasi` enum('menunggu','terverifikasi','ditolak','diterima_cod') NOT NULL DEFAULT 'menunggu',
  `tanggal_pembayaran` datetime DEFAULT NULL,
  PRIMARY KEY (`pembayaran_id`),
  KEY `fk_pembayaran_transaksi` (`transaksi_id`),
  CONSTRAINT `fk_pembayaran_transaksi` FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi` (`transaksi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pembayaran`
--

LOCK TABLES `pembayaran` WRITE;
/*!40000 ALTER TABLE `pembayaran` DISABLE KEYS */;
INSERT INTO `pembayaran` VALUES (1,1,4500000.00,'Transfer','bukti_transfer_001.jpg','terverifikasi','2026-10-06 19:05:32');
/*!40000 ALTER TABLE `pembayaran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penawaran_lelang`
--

DROP TABLE IF EXISTS `penawaran_lelang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penawaran_lelang` (
  `penawaran_id` int NOT NULL AUTO_INCREMENT,
  `lelang_id` int NOT NULL,
  `user_id` int NOT NULL,
  `jumlah_penawaran` decimal(15,2) NOT NULL,
  `waktu_penawaran` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`penawaran_id`),
  KEY `fk_penawaran_lelang` (`lelang_id`),
  KEY `fk_penawaran_user` (`user_id`),
  CONSTRAINT `fk_penawaran_lelang` FOREIGN KEY (`lelang_id`) REFERENCES `lelang` (`lelang_id`),
  CONSTRAINT `fk_penawaran_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penawaran_lelang`
--

LOCK TABLES `penawaran_lelang` WRITE;
/*!40000 ALTER TABLE `penawaran_lelang` DISABLE KEYS */;
/*!40000 ALTER TABLE `penawaran_lelang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pengajuan_donasi`
--

DROP TABLE IF EXISTS `pengajuan_donasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pengajuan_donasi` (
  `pengajuan_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `dokumen_pendukung` varchar(255) DEFAULT NULL,
  `alasan_kebutuhan` text,
  `status_verifikasi` enum('pending','disetujui','ditolak') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`pengajuan_id`),
  KEY `fk_pengajuan_user` (`user_id`),
  CONSTRAINT `fk_pengajuan_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pengajuan_donasi`
--

LOCK TABLES `pengajuan_donasi` WRITE;
/*!40000 ALTER TABLE `pengajuan_donasi` DISABLE KEYS */;
/*!40000 ALTER TABLE `pengajuan_donasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaksi`
--

DROP TABLE IF EXISTS `transaksi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaksi` (
  `transaksi_id` int NOT NULL AUTO_INCREMENT,
  `barang_id` int NOT NULL,
  `penjual_id` int NOT NULL,
  `pembeli_id` int NOT NULL,
  `metode_pembayaran` enum('COD','Transfer') NOT NULL,
  `tanggal_transaksi` datetime DEFAULT CURRENT_TIMESTAMP,
  `status_transaksi` enum('menunggu_pembayaran','menunggu_verifikasi','diproses','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu_pembayaran',
  PRIMARY KEY (`transaksi_id`),
  KEY `fk_transaksi_barang` (`barang_id`),
  KEY `fk_transaksi_penjual` (`penjual_id`),
  KEY `fk_transaksi_pembeli` (`pembeli_id`),
  CONSTRAINT `fk_transaksi_barang` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`barang_id`),
  CONSTRAINT `fk_transaksi_pembeli` FOREIGN KEY (`pembeli_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_transaksi_penjual` FOREIGN KEY (`penjual_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaksi`
--

LOCK TABLES `transaksi` WRITE;
/*!40000 ALTER TABLE `transaksi` DISABLE KEYS */;
INSERT INTO `transaksi` VALUES (1,1,1,2,'Transfer','2026-10-06 19:05:23','menunggu_verifikasi'),(2,1,1,2,'Transfer','2026-10-06 19:05:25','menunggu_verifikasi');
/*!40000 ALTER TABLE `transaksi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `alamat` text,
  `role` enum('pengguna','admin') NOT NULL DEFAULT 'pengguna',
  `foto_profil` varchar(255) DEFAULT NULL,
  `tanggal_daftar` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES 
(1,'Budi Santoso','budi@gmail.com','123456','081234567890','Surabaya','pengguna',NULL,'2026-10-06 19:04:49'),
(2,'Andi Pratama','andi@gmail.com','123456','081234567891','Surabaya','pengguna',NULL,'2026-10-06 19:04:49'),
(3,'Siti Rahma','siti@gmail.com','123456','081234567892','Sidoarjo','pengguna',NULL,'2026-10-06 19:04:49'),
(4,'Yayasan Kasih Anak','yayasan@kasihanak.org','password123','081234567788','Sukolilo, Surabaya','pengguna',NULL,'2026-10-20 10:00:00');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-17 10:45:00
