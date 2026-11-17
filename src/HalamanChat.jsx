import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  buyerCounterOffer,
  cancelDeal,
  createOffer,
} from "./utils/negotiation";
import {
  CHAT_STORAGE_KEY,
  ensureConversation,
  getConversationsForUser,
  isSellerUser,
  markConversationRead,
  sendMessage,
  countUnread,
} from "./utils/chat";

const POLL_MS = 1500;
const OFFERS_STORAGE_KEY = "treadme_offers";

function fmtRp(num) {
  return "Rp" + Number(num || 0).toLocaleString("id-ID");
}

function parseRp(str) {
  return Number(String(str || "").replace(/\D/g, ""));
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function fmtListTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return fmtTime(iso);
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function initials(name) {
  return (
    String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function isNegotiableProduct(p) {
  return !!p && p.status === "Membuka Penawaran" && p.category === "Jual";
}

/** Penawaran yang terkait dengan satu percakapan (barang + pembeli) */
function offersForConversation(conv) {
  if (!conv) return [];
  return getOffers().filter(
    (o) => String(o.itemId) === String(conv.itemId) && o.buyerId === conv.buyerId
  );
}

/** Gabungkan pesan teks & riwayat penawaran menjadi satu timeline urut waktu */
function buildTimeline(conv, offers) {
  if (!conv) return [];
  const items = (conv.messages || []).map((m) => ({ ...m, type: "chat", key: `m-${m.id}` }));
  offers.forEach((offer) => {
    (offer.history || []).forEach((h, idx) => {
      items.push({
        type: "offer",
        key: `o-${offer.id}-${idx}`,
        offer,
        entry: h,
        isLatest: idx === offer.history.length - 1,
        time: h.time,
      });
    });
  });
  return items.sort((a, b) => new Date(a.time) - new Date(b.time));
}

/** Pesan/aktivitas terakhir untuk preview di daftar percakapan */
function lastActivity(conv) {
  const lastMsg = (conv.messages || [])[conv.messages.length - 1];
  let lastOffer = null;
  offersForConversation(conv).forEach((o) => {
    const h = (o.history || [])[o.history.length - 1];
    if (h && (!lastOffer || new Date(h.time) > new Date(lastOffer.time))) lastOffer = h;
  });
  if (lastOffer && (!lastMsg || new Date(lastOffer.time) > new Date(lastMsg.time))) {
    return { text: lastOffer.note, time: lastOffer.time };
  }
  if (lastMsg) return { text: lastMsg.text, time: lastMsg.time };
  return { text: "Belum ada pesan", time: conv.updatedAt };
}

// ─── Modal Deal Confirm (sisi buyer) ───────────────────────────────────────
function DealConfirmModal({ open, dealPrice, onCancel, onProceed }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-[#DCE6DF] text-center">
        <div className="w-14 h-14 rounded-full bg-[#EAF5EF] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#1F2A24] mb-1">Harga Deal! 🎉</h3>
        <p className="text-sm text-[#516057] mb-2">Harga telah disepakati</p>
        <p className="text-2xl font-extrabold text-[#2F7D5B] mb-5">{fmtRp(dealPrice)}</p>
        <p className="text-xs text-[#718096] mb-6">
          Lanjutkan ke halaman barang untuk bayar, atau batalkan proses ini.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl"
          >
            Batalkan
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-xl shadow-sm transition-all"
          >
            Lanjut Bayar →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Komponen utama ────────────────────────────────────────────────────────
export default function HalamanChat({ product, onBack, onNavigate, onLogout, currentUser }) {
  // ── Percakapan aktif ────────────────────────────────────────────────────
  // Jika dibuka dari halaman barang oleh pembeli → buka/buat percakapan barang itu.
  // Jika dibuka dari navbar → buka percakapan terbaru.
  const [activeId, setActiveId] = useState(() => {
    if (!currentUser) return null;
    if (product && product.id != null) {
      if (!isSellerUser(currentUser, product)) {
        return ensureConversation(product, currentUser).id;
      }
      const forItem = getConversationsForUser(currentUser).find(
        (c) => String(c.itemId) === String(product.id)
      );
      if (forItem) return forItem.id;
    }
    const all = getConversationsForUser(currentUser);
    return all[0]?.id || null;
  });

  // tick dipakai untuk memicu re-render saat data localStorage berubah
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [counterInputVal, setCounterInputVal] = useState("");
  const [showCounterFor, setShowCounterFor] = useState(null); // offerId
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerInputVal, setOfferInputVal] = useState("");
  const [offerError, setOfferError] = useState("");

  // Deal confirm popup (buyer)
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealPrice, setDealPrice] = useState(null);
  const [dealOfferId, setDealOfferId] = useState(null);
  const shownPopupRef = useRef(new Set());

  const messagesEndRef = useRef(null);

  // ── Data turunan (dibaca ulang dari storage setiap render) ──────────────
  const conversations = getConversationsForUser(currentUser).filter((c) => {
    // Sembunyikan percakapan kosong dari sisi penjual (pembeli baru membuka chat)
    const isBuyerSide = c.buyerId === currentUser?.username;
    if (isBuyerSide || c.id === activeId) return true;
    return (c.messages || []).length > 0 || offersForConversation(c).length > 0;
  });
  const activeConv = conversations.find((c) => c.id === activeId) || null;

  const iAmBuyer = !!activeConv && activeConv.buyerId === currentUser?.username;
  const iAmSeller = !!activeConv && !iAmBuyer;
  const otherName = activeConv ? (iAmBuyer ? activeConv.sellerName : activeConv.buyerName) : "";
  const item = activeConv?.product || null;
  const isNegotiable = isNegotiableProduct(item);

  const convOffers = offersForConversation(activeConv);
  const timeline = buildTimeline(activeConv, convOffers);
  const activeOffer =
    convOffers.find((o) => !["rejected", "cancelled"].includes(o.status)) || null;

  const q = search.trim().toLowerCase();
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    const name = c.buyerId === currentUser?.username ? c.sellerName : c.buyerName;
    return (
      String(name || "").toLowerCase().includes(q) ||
      String(c.product?.title || "").toLowerCase().includes(q)
    );
  });

  // ── Polling localStorage + sinkron antar tab ────────────────────────────
  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    const onStorage = (e) => {
      if (!e.key || e.key === CHAT_STORAGE_KEY || e.key === OFFERS_STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  // ── Tandai sudah dibaca saat ada pesan baru di percakapan aktif ─────────
  const activeMsgCount = activeConv?.messages?.length || 0;
  useEffect(() => {
    if (activeId && currentUser) markConversationRead(activeId, currentUser.username);
  }, [activeId, activeMsgCount, currentUser]);

  // ── Auto scroll ke bawah ────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, timeline.length]);

  // ── Popup deal untuk pembeli saat penjual menerima ──────────────────────
  const acceptedOfferId = iAmBuyer && activeOffer?.status === "accepted" ? activeOffer.id : null;
  const acceptedPrice = activeOffer?.price;
  useEffect(() => {
    if (!acceptedOfferId || shownPopupRef.current.has(acceptedOfferId)) return;
    shownPopupRef.current.add(acceptedOfferId);
    setDealPrice(acceptedPrice);
    setDealOfferId(acceptedOfferId);
    setShowDealModal(true);
  }, [acceptedOfferId, acceptedPrice]);

  // Reset input saat berpindah percakapan
  const selectConversation = (id) => {
    setActiveId(id);
    setShowOfferInput(false);
    setOfferInputVal("");
    setOfferError("");
    setShowCounterFor(null);
    setCounterInputVal("");
  };

  const postMessage = (text) => {
    if (!activeConv || !currentUser) return;
    sendMessage(activeConv.id, currentUser, text);
    refresh();
  };

  // ── Kirim pesan teks ────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    postMessage(inputText);
    setInputText("");
  };

  // ── Buyer: kirim penawaran baru / counter ───────────────────────────────
  const handleBuyerSendOffer = () => {
    const val = parseRp(offerInputVal);
    if (!val || val <= 0) {
      setOfferError("Masukkan harga yang valid.");
      return;
    }
    if (item?.price && val > Number(item.price)) {
      setOfferError(`Tawaran tidak boleh melebihi harga barang (${fmtRp(item.price)}).`);
      return;
    }
    const name = currentUser.fullName || currentUser.username;
    if (activeOffer && activeOffer.status !== "accepted") {
      buyerCounterOffer(activeOffer.id, val, name);
    } else {
      createOffer({
        itemId: activeConv.itemId,
        buyerId: currentUser.username,
        buyerName: name,
        price: val,
        itemTitle: item?.title,
      });
    }
    setOfferInputVal("");
    setOfferError("");
    setShowOfferInput(false);
    refresh();
  };

  // ── Seller: terima / tolak / counter ────────────────────────────────────
  const handleSellerAccept = (offerId) => {
    acceptOffer(offerId, "seller");
    refresh();
  };

  const handleSellerReject = (offerId) => {
    rejectOffer(offerId);
    postMessage("Maaf, penawaran ini tidak bisa saya terima.");
  };

  const handleSellerCounter = (offerId) => {
    const val = parseRp(counterInputVal);
    if (!val || val <= 0) return;
    counterOffer(offerId, val);
    setShowCounterFor(null);
    setCounterInputVal("");
    refresh();
  };

  // ── Buyer: respon counter dari seller ───────────────────────────────────
  const handleBuyerAcceptCounter = (offerId, price) => {
    shownPopupRef.current.add(offerId);
    acceptOffer(offerId, "buyer");
    setDealPrice(price);
    setDealOfferId(offerId);
    setShowDealModal(true);
    refresh();
  };

  const handleBuyerCancelNegotiation = (offerId) => {
    cancelDeal(offerId);
    postMessage("Saya batalkan proses negosiasi. Terima kasih.");
  };

  // ── Deal popup ──────────────────────────────────────────────────────────
  const handleDealCancel = () => {
    setShowDealModal(false);
    if (dealOfferId) handleBuyerCancelNegotiation(dealOfferId);
  };

  const handleDealProceed = () => {
    setShowDealModal(false);
    onNavigate &&
      onNavigate("detail", {
        product: { ...item, price: dealPrice, priceText: fmtRp(dealPrice), dealPrice },
      });
  };

  const openProduct = () => {
    if (!item || !onNavigate) return;
    onNavigate(item.category === "Lelang" ? "lelang_detail" : "detail", { product: item });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const renderOfferBubble = (t) => {
    const { offer, entry, isLatest } = t;
    const status = offer.status;
    const isSellerAction = entry.actor === "seller";
    const isAcceptEntry = /menerima harga/i.test(entry.note || "");
    const isRejectEntry = /menolak/i.test(entry.note || "");

    let label = isSellerAction ? "🏷️ Penjual mengusulkan harga" : "💰 Penawaran dari pembeli";
    if (isAcceptEntry) label = "🤝 Harga disepakati";
    else if (isRejectEntry) label = "✕ Penawaran ditolak";

    const bubbleColor = isAcceptEntry
      ? "bg-emerald-50 border-emerald-200"
      : isRejectEntry
      ? "bg-red-50 border-red-200"
      : isSellerAction
      ? "bg-purple-50 border-purple-200"
      : "bg-amber-50 border-amber-200";
    const labelColor = isAcceptEntry
      ? "text-emerald-700"
      : isRejectEntry
      ? "text-red-600"
      : isSellerAction
      ? "text-purple-700"
      : "text-amber-700";

    const sellerCanAct =
      isLatest && iAmSeller && entry.actor === "buyer" && ["pending", "counter_buyer"].includes(status);
    const buyerCanAct = isLatest && iAmBuyer && entry.actor === "seller" && status === "counter_seller";

    return (
      <div key={t.key} className="flex flex-col items-stretch">
        <div className={`border rounded-2xl p-3.5 ${bubbleColor}`}>
          <p className={`text-[11px] font-bold mb-1.5 ${labelColor}`}>{label}</p>
          <p className="text-base font-extrabold text-[#1F2A24] mb-1">{fmtRp(entry.price)}</p>
          <p className="text-[11px] text-[#718096]">{entry.note}</p>

          {sellerCanAct && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => handleSellerAccept(offer.id)}
                className="flex-1 py-1.5 text-[11px] font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg">
                ✓ Terima
              </button>
              <button onClick={() => setShowCounterFor(showCounterFor === offer.id ? null : offer.id)}
                className="flex-1 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg">
                ↔ Ganti Harga
              </button>
              <button onClick={() => handleSellerReject(offer.id)}
                className="flex-1 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                ✕ Tolak
              </button>
            </div>
          )}

          {sellerCanAct && showCounterFor === offer.id && (
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span>
                <input
                  type="text" inputMode="numeric" placeholder="0"
                  value={counterInputVal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCounterInputVal(raw ? Number(raw).toLocaleString("id-ID") : "");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSellerCounter(offer.id)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#2F7D5B]"
                  autoFocus
                />
              </div>
              <button onClick={() => handleSellerCounter(offer.id)}
                className="px-3 py-2 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg">
                Kirim
              </button>
            </div>
          )}

          {buyerCanAct && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => handleBuyerAcceptCounter(offer.id, offer.price)}
                className="flex-1 py-1.5 text-[11px] font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg">
                ✓ Setuju Harga Ini
              </button>
              <button onClick={() => { setShowOfferInput(true); setOfferInputVal(""); setOfferError(""); }}
                className="flex-1 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
                ↔ Ajukan Harga Lain
              </button>
              <button onClick={() => handleBuyerCancelNegotiation(offer.id)}
                className="flex-1 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg">
                ✕ Batalkan
              </button>
            </div>
          )}

          {isLatest && status === "accepted" && iAmBuyer && (
            <button onClick={() => { setDealPrice(offer.price); setDealOfferId(offer.id); setShowDealModal(true); }}
              className="w-full mt-3 py-1.5 text-[11px] font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg">
              Lanjut Bayar {fmtRp(offer.price)} →
            </button>
          )}
          {isLatest && status === "accepted" && iAmSeller && (
            <div className="mt-3 text-[11px] font-bold text-emerald-700 bg-white/70 border border-emerald-200 rounded-lg px-3 py-1.5 text-center">
              Menunggu pembayaran dari pembeli
            </div>
          )}
          {isLatest && status === "cancelled" && (
            <div className="mt-3 text-[11px] font-bold text-gray-500 bg-white/70 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
              Negosiasi dibatalkan
            </div>
          )}
          {isLatest && iAmBuyer && status === "pending" && (
            <p className="mt-2 text-[11px] font-semibold text-amber-700">⏳ Menunggu respons penjual…</p>
          )}
          {isLatest && iAmBuyer && status === "counter_buyer" && (
            <p className="mt-2 text-[11px] font-semibold text-amber-700">⏳ Menunggu penjual merespons tawaran barumu…</p>
          )}
          {isLatest && iAmSeller && status === "counter_seller" && (
            <p className="mt-2 text-[11px] font-semibold text-purple-700">⏳ Menunggu respons pembeli…</p>
          )}
        </div>
        <span className="text-[10px] text-[#718096] mt-1 px-1">{fmtTime(t.time)}</span>
      </div>
    );
  };

  const renderChatRoom = () => {
    if (!currentUser) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-bold text-[#1F2A24] mb-1">Kamu belum masuk</p>
          <p className="text-xs text-[#718096] mb-4">Masuk dulu untuk mulai mengobrol dengan penjual.</p>
          <button onClick={() => onNavigate && onNavigate("login")}
            className="px-5 py-2 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] text-white text-xs font-bold">
            Masuk
          </button>
        </div>
      );
    }

    if (!activeConv) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#EAF5EF] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.83L3 20l1.4-3.72A7.6 7.6 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1F2A24] mb-1">
            {conversations.length ? "Pilih percakapan" : "Belum ada percakapan"}
          </p>
          <p className="text-xs text-[#718096] mb-4">
            {conversations.length
              ? "Pilih salah satu percakapan di sebelah kiri."
              : "Buka halaman barang lalu tekan tombol chat untuk menghubungi penjual."}
          </p>
          {!conversations.length && (
            <button onClick={onBack}
              className="px-5 py-2 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2A24]">
              Jelajahi Barang
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Header chat room */}
        <div className="p-4 border-b border-[#EAEFEA]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-sm flex items-center justify-center shrink-0">
                {initials(otherName)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#1F2A24] truncate">{otherName}</h3>
                <p className="text-[11px] text-[#718096]">{iAmBuyer ? "Penjual" : "Pembeli"}</p>
              </div>
            </div>
            <button onClick={openProduct}
              className="px-4 py-1.5 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2A24] transition-colors shrink-0">
              Lihat Barang
            </button>
          </div>

          {/* Product preview */}
          {item && (
            <div onClick={openProduct}
              className="bg-[#F6FAF7] border border-[#E8EEEA] rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer hover:border-[#2F7D5B]/40 transition-colors">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-[#EAF5EF] shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#1F2A24] truncate">{item.title}</h4>
                <p className="text-xs font-extrabold text-[#2F7D5B] mt-0.5">{item.priceText || fmtRp(item.price)}</p>
              </div>
              {isNegotiable && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                  Bisa Nego
                </span>
              )}
              <span className="text-[11px] font-bold text-[#2F7D5B] px-2">&rarr;</span>
            </div>
          )}
        </div>

        {/* Messages stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[420px]">
          {timeline.length === 0 && (
            <div className="h-full flex items-center justify-center text-center py-10">
              <p className="text-xs text-[#718096]">
                Belum ada pesan. Mulai percakapan dengan {otherName}.
              </p>
            </div>
          )}
          {timeline.map((t) => {
            if (t.type === "offer") return renderOfferBubble(t);
            const isMe = t.senderId === currentUser.username;
            return (
              <div key={t.key} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] sm:max-w-md p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-wrap break-words
                  ${isMe ? "bg-[#2F7D5B] text-white rounded-tr-sm" : "bg-white border border-[#E2E8F0] text-[#1F2A24] rounded-tl-sm"}`}>
                  {t.text}
                </div>
                <span className="text-[10px] text-[#718096] mt-1 px-1">{fmtTime(t.time)}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input penawaran harga (buyer) */}
        {isNegotiable && iAmBuyer && showOfferInput && (
          <div className="px-4 pb-2">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 shrink-0">Tawar:</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span>
                  <input
                    type="text" inputMode="numeric" placeholder="Masukkan harga"
                    value={offerInputVal}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setOfferInputVal(raw ? Number(raw).toLocaleString("id-ID") : "");
                      setOfferError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleBuyerSendOffer()}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-amber-300 text-xs font-bold bg-white focus:outline-none focus:border-[#2F7D5B]"
                    autoFocus
                  />
                </div>
                <button onClick={handleBuyerSendOffer}
                  className="px-4 py-2 text-[11px] font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg shrink-0">
                  Kirim
                </button>
                <button onClick={() => { setShowOfferInput(false); setOfferInputVal(""); setOfferError(""); }}
                  className="px-3 py-2 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 rounded-lg shrink-0">
                  Batal
                </button>
              </div>
              {offerError && <p className="text-[11px] text-red-600 font-semibold mt-2">{offerError}</p>}
            </div>
          </div>
        )}

        {/* Bottom: quick actions + input teks */}
        <div className="p-4 border-t border-[#EAEFEA]">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setInputText("Bisa COD di area mana saja Kak?")}
              className="px-3 py-1.5 rounded-full border border-[#DCE6DF] bg-white hover:bg-gray-50 text-[11px] font-medium text-[#1F2A24] whitespace-nowrap flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Tentukan titik COD
            </button>

            {isNegotiable && iAmBuyer && !["pending", "counter_buyer", "accepted"].includes(activeOffer?.status) && (
              <button
                onClick={() => { setShowOfferInput(true); setOfferInputVal(""); setOfferError(""); }}
                className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-700 whitespace-nowrap flex items-center gap-1.5 transition-colors">
                💰 Ajukan Penawaran
              </button>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan..."
              maxLength={1000}
              className="flex-1 h-[46px] px-4 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] placeholder:text-[#718096] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/15" />
            <button type="submit" disabled={!inputText.trim()}
              className="h-[46px] px-5 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <span>Kirim</span>
              <span>&rarr;</span>
            </button>
          </form>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-plusJakartaSans text-[#1F2A24] flex flex-col">

      {/* NAVBAR */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-2.5 group focus:outline-none">
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none">T</span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">TradeMe</span>
          </button>
          <button type="button" onClick={onBack} className="p-2 text-[#1F2A24] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-[1080px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col">
        <p className="text-[#2F7D5B] text-[11px] font-extrabold tracking-[0.16em] uppercase mb-1">Pesan</p>
        <h1 className="text-3xl sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-6">Chat</h1>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col md:flex-row flex-1 min-h-[600px]">

          {/* Kiri: Daftar percakapan */}
          <div className="w-full md:w-[300px] border-b md:border-b-0 md:border-r border-[#E2E8F0] p-4 flex flex-col bg-[#FDFEFE] shrink-0">
            <div className="relative mb-4">
              <input type="text" placeholder="Cari percakapan" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#1F2A24] placeholder:text-[#718096] focus:outline-none focus:border-[#2F7D5B]" />
              <svg className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[240px] md:max-h-none">
              {filteredConversations.length === 0 && (
                <p className="text-[11px] text-[#718096] text-center py-6">
                  {q ? "Tidak ada percakapan yang cocok." : "Belum ada percakapan."}
                </p>
              )}
              {filteredConversations.map((c) => {
                const active = c.id === activeId;
                const isBuyerSide = c.buyerId === currentUser?.username;
                const name = isBuyerSide ? c.sellerName : c.buyerName;
                const last = lastActivity(c);
                const unread = active ? 0 : countUnread(c, currentUser.username);
                return (
                  <button type="button" key={c.id} onClick={() => selectConversation(c.id)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors
                    ${active ? "bg-[#EAF5EF] border border-[#D5E5DC]" : "bg-white hover:bg-gray-50 border border-transparent"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                        ${active ? "bg-[#D2E7DA] text-[#2F7D5B]" : "bg-gray-100 text-gray-700"}`}>
                        {initials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#1F2A24] truncate">{name}</h4>
                        <p className="text-[10px] text-[#2F7D5B] font-semibold truncate">{c.product?.title}</p>
                        <p className={`text-[11px] truncate mt-0.5 ${unread ? "text-[#1F2A24] font-semibold" : "text-[#718096]"}`}>
                          {last.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className="text-[10px] text-[#718096]">{fmtListTime(last.time)}</span>
                      {unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2F7D5B] text-white text-[10px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kanan: Chat room */}
          <div className="flex-1 flex flex-col">{renderChatRoom()}</div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E8EEEA] bg-white pt-8 pb-10 mt-6">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold leading-none">T</span>
              </div>
              <span className="text-[#1F2A24] text-[20px] font-extrabold tracking-tight">TradeMe</span>
              <span className="text-sm text-[#718096] hidden md:inline ml-3">Memberi nilai baru pada barang lama.</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
              <button type="button" onClick={() => onNavigate && onNavigate("donasi")} className="hover:text-[#2F7D5B] transition-colors focus:outline-none">Donasi</button>
              <button type="button" onClick={onBack} className="hover:text-[#2F7D5B] transition-colors focus:outline-none">Beranda</button>
              <button type="button" onClick={() => onLogout && onLogout()} className="hover:text-red-600 transition-colors focus:outline-none">Keluar</button>
            </div>
          </div>
          <div className="text-xs text-[#8A948E] pt-2 border-t border-[#F0F4F1]">
            © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
          </div>
        </div>
      </footer>

      <DealConfirmModal
        open={showDealModal}
        dealPrice={dealPrice}
        onCancel={handleDealCancel}
        onProceed={handleDealProceed}
      />
    </div>
  );
}
