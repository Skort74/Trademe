// src/utils/chat.js
// Storage helper untuk fitur chat TradeMe (percakapan pembeli <-> penjual per barang)

import { DEFAULT_USERS } from "./auth";

const STORAGE_KEY = "treadme_conversations";
export const CHAT_STORAGE_KEY = STORAGE_KEY;

// Penjual default bila data barang belum punya info penjual
// (konsisten dengan logika isSeller di DetailCard: admin / budi)
const DEFAULT_SELLER = DEFAULT_USERS.find((u) => u.username === "budi") || {
  username: "budi",
  fullName: "Budi Santoso",
};

/** Info penjual sebuah barang */
export function getSellerOf(product) {
  return {
    id: product?.sellerId || DEFAULT_SELLER.username,
    name: product?.sellerName || DEFAULT_SELLER.fullName,
  };
}

/** Apakah user adalah pihak penjual (admin atau pemilik barang) */
export function isSellerUser(user, product) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.username === getSellerOf(product).id;
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export function conversationId(itemId, buyerId) {
  return `${itemId}__${buyerId}`;
}

function productSnapshot(product) {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    priceText: product.priceText,
    image: product.image,
    status: product.status,
    category: product.category,
    location: product.location,
  };
}

/** Semua percakapan di mana user terlibat (admin melihat semua), terbaru dulu */
export function getConversationsForUser(user) {
  if (!user) return [];
  return readAll()
    .filter(
      (c) =>
        user.role === "admin" ||
        c.buyerId === user.username ||
        c.sellerId === user.username
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getConversation(id) {
  return readAll().find((c) => c.id === id) || null;
}

/** Ambil percakapan buyer untuk barang tertentu, buat baru bila belum ada */
export function ensureConversation(product, buyer) {
  const list = readAll();
  const id = conversationId(product.id, buyer.username);
  const existing = list.find((c) => c.id === id);
  if (existing) {
    // Perbarui snapshot barang agar harga/status terbaru ikut tersimpan
    existing.product = { ...existing.product, ...productSnapshot(product) };
    saveAll(list);
    return existing;
  }

  const seller = getSellerOf(product);
  const now = new Date().toISOString();
  const conv = {
    id,
    itemId: product.id,
    product: productSnapshot(product),
    buyerId: buyer.username,
    buyerName: buyer.fullName || buyer.username,
    sellerId: seller.id,
    sellerName: seller.name,
    messages: [],
    lastRead: {},
    createdAt: now,
    updatedAt: now,
  };
  list.push(conv);
  saveAll(list);
  return conv;
}

/** Kirim pesan teks ke percakapan */
export function sendMessage(convId, sender, text) {
  const clean = String(text || "").trim();
  if (!clean) return null;
  const list = readAll();
  const conv = list.find((c) => c.id === convId);
  if (!conv) return null;

  const now = new Date().toISOString();
  const msg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: sender.username,
    senderName: sender.fullName || sender.username,
    text: clean,
    time: now,
  };
  conv.messages = [...(conv.messages || []), msg];
  conv.updatedAt = now;
  conv.lastRead = { ...(conv.lastRead || {}), [sender.username]: now };
  saveAll(list);
  return msg;
}

/** Tandai percakapan sudah dibaca oleh user */
export function markConversationRead(convId, username) {
  const list = readAll();
  const conv = list.find((c) => c.id === convId);
  if (!conv) return;
  conv.lastRead = { ...(conv.lastRead || {}), [username]: new Date().toISOString() };
  saveAll(list);
}

/** Jumlah pesan dari lawan bicara yang belum dibaca user */
export function countUnread(conv, username) {
  const last = conv.lastRead?.[username];
  return (conv.messages || []).filter(
    (m) => m.senderId !== username && (!last || new Date(m.time) > new Date(last))
  ).length;
}
