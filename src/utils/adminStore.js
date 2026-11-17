// src/utils/adminStore.js
// Penyimpanan localStorage untuk data yang dikelola Panel Admin:
// transaksi, sengketa, yayasan, pengajuan penerima, penawaran lelang & hasil lelang.
// Ganti isi fungsi di sini dengan pemanggilan API saat backend siap.

export const STORE_EVENT = "treadme-store-change";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createCollection(key, prefix, initialData = []) {
  const all = () => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];

      // Tambahkan seed satu kali, termasuk untuk browser yang sudah memiliki
      // data sebelum seed diperkenalkan. Setelah itu data tetap dikelola admin.
      const seedKey = `${key}_seed_v2`;
      if (initialData.length > 0 && localStorage.getItem(seedKey) !== "done") {
        const initialById = new Map(initialData.map((item) => [item.id, item]));
        const existingIds = new Set(parsed.map((item) => item.id));
        const migrated = parsed.map((item) => ({ ...initialById.get(item.id), ...item }));
        const seeded = [...migrated, ...initialData.filter((item) => !existingIds.has(item.id))];
        localStorage.setItem(key, JSON.stringify(seeded));
        localStorage.setItem(seedKey, "done");
        return seeded;
      }

      return parsed;
    } catch (e) {
      return [];
    }
  };

  const save = (list) => {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
    } catch (e) {}
  };

  const add = (data) => {
    const now = new Date().toISOString();
    const record = { id: makeId(prefix), createdAt: now, updatedAt: now, ...data };
    save([record, ...all()]);
    return record;
  };

  const update = (id, patch) => {
    let updated = null;
    save(
      all().map((r) => {
        if (r.id !== id) return r;
        updated = { ...r, ...patch, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
    return updated;
  };

  const remove = (id) => save(all().filter((r) => r.id !== id));

  return { key, all, save, add, update, remove };
}

/**
 * Transaksi pembelian.
 * { itemId, itemTitle, itemImage, category, buyerId, buyerName, sellerName,
 *   amount, serviceFee, total, paymentMethod, deliveryMethod, meetingTime, notes,
 *   status: "Menunggu Pembayaran" | "Dibayar" | "Dikirim" | "Selesai" | "Dibatalkan" | "Dana Dikembalikan" }
 */
export const transactions = createCollection("treadme_transactions", "TRX");

/**
 * Sengketa transaksi.
 * { transactionId, itemTitle, buyerName, sellerName, amount, reporter, reason,
 *   status: "Terbuka" | "Ditinjau" | "Selesai", resolution, adminNote }
 */
export const disputes = createCollection("treadme_disputes", "SKT");

/**
 * Yayasan mitra penerima donasi.
 * { name, location, contact, description, needs, status: "Aktif" | "Nonaktif" }
 */
export const FOUNDATION_SEED = [
  {
    id: "YYS-001",
    name: "Yayasan Kasih Anak",
    needs: "Buku pelajaran, seragam sekolah, mainan edukatif",
    location: "Gubeng, Surabaya",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
  },
  {
    id: "YYS-002",
    name: "Panti Asuhan Harapan",
    needs: "Peralatan dapur, selimut, pakaian layak pakai",
    location: "Wonokromo, Surabaya",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
  },
  {
    id: "YYS-003",
    name: "Rumah Singgah Mandiri",
    needs: "Furnitur bekas, elektronik fungsional, bahan bangunan",
    location: "Rungkut, Surabaya",
    image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
  },
];

export const foundations = createCollection("treadme_foundations", "YYS", FOUNDATION_SEED);

/**
 * Pengajuan menjadi penerima donasi (dari form AjukanPenerima).
 * { tipe_penerima, nama_lembaga, lokasi, alasan_kebutuhan, dokumen: [nama file],
 *   applicantId, applicantName, status: "Menunggu" | "Disetujui" | "Ditolak", adminNote }
 */
export const RECIPIENT_APPLICATION_SEED = [
  {
    id: "PNR-001",
    tipe_penerima: "perorangan",
    applicantName: "Siti Aminah",
    nama_penerima: "Siti Aminah",
    alasan_kebutuhan: "Buku, meja belajar, pakaian anak",
    lokasi: "Sukolilo, Surabaya",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    status: "Disetujui",
  },
  {
    id: "PNR-002",
    tipe_penerima: "perorangan",
    applicantName: "Pak Hasan",
    nama_penerima: "Pak Hasan",
    alasan_kebutuhan: "Peralatan rumah tangga",
    lokasi: "Rungkut, Surabaya",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    status: "Disetujui",
  },
  {
    id: "PNR-003",
    tipe_penerima: "perorangan",
    applicantName: "Keluarga Ibu Ratna",
    nama_penerima: "Keluarga Ibu Ratna",
    alasan_kebutuhan: "Furnitur dan elektronik",
    lokasi: "Tegalsari, Surabaya",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80",
    status: "Disetujui",
  },
];

export const recipientApplications = createCollection(
  "treadme_recipient_applications",
  "PNR",
  RECIPIENT_APPLICATION_SEED,
);

/**
 * Penawaran lelang dari pengguna.
 * { itemId, itemTitle, itemImage, bidderId, bidderName, amount }
 */
export const auctionBids = createCollection("treadme_auction_bids", "BID");

/**
 * Hasil lelang yang sudah ditetapkan admin.
 * { itemId, itemTitle, winnerId, winnerName, amount, bidId, transactionId,
 *   status: "Pemenang Ditetapkan" | "Ditutup Tanpa Pemenang" }
 */
export const auctionResults = createCollection("treadme_auction_results", "LLG");

export const ALL_STORE_KEYS = [
  transactions.key,
  disputes.key,
  foundations.key,
  recipientApplications.key,
  auctionBids.key,
  auctionResults.key,
];

// ─── Barang yang dikurasi admin (tab Barang) ────────────────────────────────
export const ADMIN_ITEMS_KEY = "trademe_admin_items";

// Data awal tab Barang bila belum ada data tersimpan
export const ADMIN_ITEMS_SEED = [
  {
    id: 1,
    barang: "Meja Belajar Kayu",
    pemilik: "Nadia Rahma",
    jenis: "Donasi",
    kurasi: "Menunggu",
    kondisi: "Kondisi baik",
    image: "/ImageMejaBelajarKayu.png",
    catatan: "Perlu cek kelengkapan baut dan kebersihan kayu.",
  },
  {
    id: 2,
    barang: "Kamera Analog",
    pemilik: "Rian Putra",
    jenis: "Lelang",
    kurasi: "Ditinjau",
    kondisi: "Fungsi normal, mulus",
    image: "/images/hero-antique.jpg",
    catatan: "Shutter speed dan aperture bekerja dengan baik.",
  },
  {
    id: 3,
    barang: "Sepeda Lipat",
    pemilik: "Budi Santoso",
    jenis: "Jual",
    kurasi: "Dilaporkan",
    kondisi: "Cat orisinal, siap pakai",
    image: "/images/vintage-bike.jpg",
    catatan: "Laporan terkait foto kurang jelas dari sudut belakang.",
  },
];

export function getAdminItems() {
  try {
    const raw = localStorage.getItem(ADMIN_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return ADMIN_ITEMS_SEED;
}

/** Simpan daftar barang (tanpa memicu event, dipakai oleh PanelAdminBarang) */
export function saveAdminItems(list) {
  try {
    localStorage.setItem(ADMIN_ITEMS_KEY, JSON.stringify(list));
  } catch (e) {}
}

/** Tambah barang baru ke antrean kurasi admin (mis. dari halaman unggah donasi) */
export function addAdminItem(data) {
  const list = getAdminItems();
  const id = list.length ? Math.max(...list.map((i) => Number(i.id) || 0)) + 1 : 1;
  const item = { kurasi: "Menunggu", catatan: "", createdAt: new Date().toISOString(), ...data, id };
  saveAdminItems([item, ...list]);
  try {
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key: ADMIN_ITEMS_KEY } }));
  } catch (e) {}
  return item;
}
