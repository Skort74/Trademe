// src/utils/adminStore.js
// Penyimpanan localStorage untuk data yang dikelola Panel Admin:
// transaksi, sengketa, yayasan, pengajuan penerima, penawaran lelang & hasil lelang.
// Ganti isi fungsi di sini dengan pemanggilan API saat backend siap.

export const STORE_EVENT = "treadme-store-change";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createCollection(key, prefix) {
  const all = () => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
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
export const foundations = createCollection("treadme_foundations", "YYS");

/**
 * Pengajuan menjadi penerima donasi (dari form AjukanPenerima).
 * { tipe_penerima, nama_lembaga, lokasi, alasan_kebutuhan, dokumen: [nama file],
 *   applicantId, applicantName, status: "Menunggu" | "Disetujui" | "Ditolak", adminNote }
 */
export const recipientApplications = createCollection("treadme_recipient_applications", "PNR");

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
