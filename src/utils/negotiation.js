// src/utils/negotiation.js
// Storage helper untuk fitur negosiasi / tawar-menawar TradeMe

const STORAGE_KEY = "treadme_offers";

/** Ambil semua penawaran dari localStorage */
export function getOffers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/** Simpan array penawaran ke localStorage */
function saveOffers(offers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  } catch (e) {}
}

/**
 * Buat penawaran baru oleh buyer.
 * @param {object} param0
 * @param {number|string} param0.itemId
 * @param {string} param0.buyerId   - username buyer
 * @param {string} param0.buyerName - nama lengkap buyer
 * @param {number} param0.price     - harga yang ditawarkan
 * @param {string} param0.itemTitle - judul barang
 * @returns penawaran baru
 */
export function createOffer({ itemId, buyerId, buyerName, price, itemTitle }) {
  const offers = getOffers();
  // Hapus penawaran lama dari buyer yang sama untuk item yang sama
  const filtered = offers.filter(
    (o) => !(o.itemId === itemId && o.buyerId === buyerId)
  );

  const newOffer = {
    id: Date.now(),
    itemId,
    buyerId,
    buyerName,
    itemTitle,
    price,          // harga saat ini (bisa diubah saat counter)
    originalPrice: price,
    status: "pending", // pending | accepted | rejected | counter_buyer | counter_seller
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        actor: "buyer",
        price,
        note: `${buyerName} mengajukan harga Rp${price.toLocaleString("id-ID")}`,
        time: new Date().toISOString(),
      },
    ],
  };

  filtered.push(newOffer);
  saveOffers(filtered);
  return newOffer;
}

/**
 * Menerima harga saat ini.
 * @param {"seller"|"buyer"} actor - siapa yang menyetujui (default: penjual)
 */
export function acceptOffer(offerId, actor = "seller") {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  offers[idx] = {
    ...offers[idx],
    status: "accepted",
    updatedAt: new Date().toISOString(),
    history: [
      ...offers[idx].history,
      {
        actor,
        price: offers[idx].price,
        note: `${actor === "buyer" ? "Pembeli" : "Penjual"} menerima harga Rp${offers[idx].price.toLocaleString("id-ID")}`,
        time: new Date().toISOString(),
      },
    ],
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Penjual menolak penawaran.
 */
export function rejectOffer(offerId) {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  offers[idx] = {
    ...offers[idx],
    status: "rejected",
    updatedAt: new Date().toISOString(),
    history: [
      ...offers[idx].history,
      {
        actor: "seller",
        price: offers[idx].price,
        note: "Penjual menolak penawaran.",
        time: new Date().toISOString(),
      },
    ],
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Penjual mengajukan counter offer (minta ganti harga).
 */
export function counterOffer(offerId, newPrice) {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  offers[idx] = {
    ...offers[idx],
    price: newPrice,
    status: "counter_seller",
    updatedAt: new Date().toISOString(),
    history: [
      ...offers[idx].history,
      {
        actor: "seller",
        price: newPrice,
        note: `Penjual mengusulkan harga Rp${newPrice.toLocaleString("id-ID")}`,
        time: new Date().toISOString(),
      },
    ],
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Buyer membalas counter offer dari penjual (ajukan ulang harga).
 */
export function buyerCounterOffer(offerId, newPrice, buyerName) {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  offers[idx] = {
    ...offers[idx],
    price: newPrice,
    status: "counter_buyer",
    updatedAt: new Date().toISOString(),
    history: [
      ...offers[idx].history,
      {
        actor: "buyer",
        price: newPrice,
        note: `${buyerName} mengajukan ulang harga Rp${newPrice.toLocaleString("id-ID")}`,
        time: new Date().toISOString(),
      },
    ],
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Buyer membatalkan deal (setelah penjual terima tapi buyer cancel di popup).
 */
export function cancelDeal(offerId) {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;
  offers[idx] = {
    ...offers[idx],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  saveOffers(offers);
  return offers[idx];
}

/**
 * Ambil penawaran aktif milik buyer untuk item tertentu.
 */
export function getMyOffer(itemId, buyerId) {
  const offers = getOffers();
  return (
    offers.find(
      (o) =>
        String(o.itemId) === String(itemId) &&
        o.buyerId === buyerId &&
        !["rejected", "cancelled"].includes(o.status)
    ) || null
  );
}

/**
 * Ambil semua penawaran yang masuk untuk item tertentu (sisi penjual).
 */
export function getOffersForItem(itemId) {
  const offers = getOffers();
  return offers.filter(
    (o) =>
      String(o.itemId) === String(itemId) &&
      !["rejected", "cancelled"].includes(o.status)
  );
}

