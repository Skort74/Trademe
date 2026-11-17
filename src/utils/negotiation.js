// src/utils/negotiation.js
// Storage helper untuk fitur negosiasi / tawar-menawar TradeMe.
// Seluruh negosiasi dijalankan lewat halaman Chat; data disimpan di localStorage.
//
// Status penawaran:
//   pending        → pembeli mengajukan harga, menunggu penjual
//   counter_seller → penjual mengusulkan harga lain, menunggu pembeli
//   counter_buyer  → pembeli membalas dengan harga baru, menunggu penjual
//   accepted       → harga disepakati, menunggu pembayaran pembeli
//   completed      → pembeli sudah membayar harga deal
//   rejected       → penjual menolak
//   cancelled      → dibatalkan (oleh pembeli / penjual)

export const OFFERS_STORAGE_KEY = "treadme_offers";
export const ACTIVE_STATUSES = ["pending", "counter_seller", "counter_buyer", "accepted"];

/** Ambil semua penawaran dari localStorage */
export function getOffers() {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveOffers(offers) {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (e) {}
}

const rp = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;
const sameItem = (a, b) => String(a) === String(b);

/** Ubah satu penawaran + tambahkan entri riwayat */
function updateOffer(offerId, patch, entry) {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  offers[idx] = {
    ...offers[idx],
    ...patch,
    updatedAt: now,
    history: entry ? [...(offers[idx].history || []), { ...entry, time: now }] : offers[idx].history,
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Jenis entri riwayat. Entri baru menyimpan `kind`; untuk data lama
 * (sebelum ada `kind`) jenisnya ditebak dari teks catatan.
 * @returns {"offer"|"counter"|"accept"|"reject"|"cancel"|"complete"}
 */
export function entryKind(h) {
  if (h.kind) return h.kind;
  const note = String(h.note || "");
  if (/menerima harga/i.test(note)) return "accept";
  if (/menolak/i.test(note)) return "reject";
  if (h.actor === "seller") return "counter";
  return "offer";
}

/** Pembeli membuat penawaran baru. Penawaran aktif sebelumnya otomatis dibatalkan (riwayat tetap ada). */
export function createOffer({ itemId, buyerId, buyerName, price, itemTitle }) {
  const now = new Date().toISOString();
  const offers = getOffers().map((o) =>
    sameItem(o.itemId, itemId) && o.buyerId === buyerId && ACTIVE_STATUSES.includes(o.status)
      ? {
          ...o,
          status: "cancelled",
          updatedAt: now,
          history: [...(o.history || []), { actor: "buyer", kind: "cancel", price: o.price, note: "Diganti dengan penawaran baru.", time: now }],
        }
      : o
  );

  const newOffer = {
    id: Date.now(),
    itemId,
    buyerId,
    buyerName,
    itemTitle,
    price,
    originalPrice: price,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    history: [{ actor: "buyer", kind: "offer", price, note: `${buyerName} menawar ${rp(price)}`, time: now }],
  };
  offers.push(newOffer);
  saveOffers(offers);
  return newOffer;
}

/** Menyetujui harga saat ini (penjual menerima tawaran, atau pembeli menyetujui usulan penjual). */
export function acceptOffer(offerId, actor = "seller") {
  const offer = getOffers().find((o) => o.id === offerId);
  if (!offer) return null;
  return updateOffer(
    offerId,
    { status: "accepted" },
    { actor, kind: "accept", price: offer.price, note: `${actor === "buyer" ? "Pembeli" : "Penjual"} menyetujui harga ${rp(offer.price)}` }
  );
}

/** Penjual menolak penawaran. */
export function rejectOffer(offerId) {
  const offer = getOffers().find((o) => o.id === offerId);
  if (!offer) return null;
  return updateOffer(offerId, { status: "rejected" }, { actor: "seller", kind: "reject", price: offer.price, note: "Penjual menolak penawaran." });
}

/** Penjual mengusulkan harga lain. */
export function counterOffer(offerId, newPrice) {
  return updateOffer(
    offerId,
    { price: newPrice, status: "counter_seller" },
    { actor: "seller", kind: "counter", price: newPrice, note: `Penjual mengusulkan ${rp(newPrice)}` }
  );
}

/** Pembeli membalas usulan penjual dengan harga baru. */
export function buyerCounterOffer(offerId, newPrice, buyerName) {
  return updateOffer(
    offerId,
    { price: newPrice, status: "counter_buyer" },
    { actor: "buyer", kind: "offer", price: newPrice, note: `${buyerName || "Pembeli"} menawar ${rp(newPrice)}` }
  );
}

/** Membatalkan negosiasi (termasuk setelah deal, sebelum dibayar). */
export function cancelDeal(offerId, actor = "buyer") {
  const offer = getOffers().find((o) => o.id === offerId);
  if (!offer) return null;
  return updateOffer(
    offerId,
    { status: "cancelled" },
    { actor, kind: "cancel", price: offer.price, note: `${actor === "seller" ? "Penjual" : "Pembeli"} membatalkan negosiasi.` }
  );
}

/**
 * Tandai deal selesai di checkout (sudah dibayar, atau pesanan COD dibuat).
 * @param {{ cod?: boolean }} options - cod: pembayaran dilakukan saat bertemu
 */
export function completeOffer(offerId, { cod = false } = {}) {
  const offer = getOffers().find((o) => o.id === offerId);
  if (!offer || offer.status !== "accepted") return null;
  return updateOffer(
    offerId,
    { status: "completed" },
    {
      actor: "buyer",
      kind: "complete",
      cod,
      price: offer.price,
      note: cod ? `Pesanan COD ${rp(offer.price)} dibuat` : `Pembeli membayar ${rp(offer.price)}`,
    }
  );
}

/** Penawaran aktif milik pembeli untuk barang tertentu. */
export function getMyOffer(itemId, buyerId) {
  return (
    getOffers().find(
      (o) => sameItem(o.itemId, itemId) && o.buyerId === buyerId && ACTIVE_STATUSES.includes(o.status)
    ) || null
  );
}

/** Semua penawaran aktif untuk barang tertentu (sisi penjual). */
export function getOffersForItem(itemId) {
  return getOffers().filter((o) => sameItem(o.itemId, itemId) && ACTIVE_STATUSES.includes(o.status));
}
