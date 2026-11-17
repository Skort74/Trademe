import React, { useState, useEffect, useCallback } from "react";
import {
  createOffer,
  acceptOffer,
  rejectOffer,
  counterOffer,
  buyerCounterOffer,
  cancelDeal,
  getMyOffer,
  getOffersForItem,
} from "./utils/negotiation";

// ─────────────────────────────────────────────
// Helper: format angka ke Rupiah
// ─────────────────────────────────────────────
function fmtRp(num) {
  return "Rp" + Number(num).toLocaleString("id-ID");
}

// ─────────────────────────────────────────────
// Modal: Buyer ajukan / balas penawaran
// ─────────────────────────────────────────────
function OfferModal({ open, initialPrice, maxPrice, mode, onClose, onSubmit }) {
  const [inputVal, setInputVal] = useState(String(initialPrice || ""));
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) setInputVal(String(initialPrice || ""));
    setErr("");
  }, [open, initialPrice]);

  if (!open) return null;

  const handleSubmit = () => {
    const val = Number(String(inputVal).replace(/\D/g, ""));
    if (!val || val <= 0) {
      setErr("Masukkan nominal harga yang valid.");
      return;
    }
    if (val > maxPrice * 1.5) {
      setErr(`Harga tidak boleh melebihi ${fmtRp(maxPrice * 1.5)}.`);
      return;
    }
    onSubmit(val);
  };

  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setInputVal(raw ? Number(raw).toLocaleString("id-ID") : "");
    setErr("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#DCE6DF]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
          aria-label="Tutup"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#EAF5EF] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#1F2A24] text-base">
              {mode === "counter" ? "Balas Tawaran Penjual" : "Ajukan Penawaran"}
            </h3>
            <p className="text-xs text-[#718096]">Harga awal: {fmtRp(maxPrice)}</p>
          </div>
        </div>

        <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
          {mode === "counter" ? "Harga balasan Anda" : "Harga yang kamu tawarkan"}
        </label>
        <div className="relative mb-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#718096]">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={handleInput}
            placeholder="0"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DCE6DF] text-sm font-bold text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/20"
          />
        </div>
        {err && <p className="text-xs text-red-500 mb-2">{err}</p>}

        <p className="text-[11px] text-[#718096] mb-5">
          Penawaran akan dikirim ke penjual. Penjual bisa menerima, menolak, atau mengusulkan harga lain.
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-xl shadow-sm transition-all"
          >
            {mode === "counter" ? "Kirim Balasan" : "Kirim Penawaran"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal: Konfirmasi deal (buyer terima)
// ─────────────────────────────────────────────
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
        <p className="text-sm text-[#516057] mb-2">Penjual menyetujui harga</p>
        <p className="text-2xl font-extrabold text-[#2F7D5B] mb-5">{fmtRp(dealPrice)}</p>
        <p className="text-xs text-[#718096] mb-6">Lanjutkan ke pembayaran atau batalkan proses tawar-menawar ini.</p>
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
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal: Counter offer dari penjual (sisi buyer)
// ─────────────────────────────────────────────
function SellerCounterModal({ open, counterPrice, originalPrice, onReject, onAccept, onCounter }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-[#DCE6DF] text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-[#1F2A24] mb-1">Penjual Mengusulkan Harga</h3>
        <p className="text-xs text-[#718096] mb-2">Harga awal: {fmtRp(originalPrice)}</p>
        <p className="text-2xl font-extrabold text-amber-600 mb-5">{fmtRp(counterPrice)}</p>
        <p className="text-xs text-[#718096] mb-6">Setujui harga ini, tolak, atau ajukan harga lain.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onAccept}
            className="w-full py-2.5 text-sm font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-xl shadow-sm"
          >
            Setuju Harga Ini
          </button>
          <button
            onClick={onCounter}
            className="w-full py-2.5 text-sm font-semibold text-[#2F7D5B] border border-[#2F7D5B] hover:bg-[#EAF5EF] rounded-xl"
          >
            Ajukan Harga Lain
          </button>
          <button
            onClick={onReject}
            className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl"
          >
            Batalkan Negosiasi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel Penjual: muncul di DetailCard jika currentUser = penjual / admin
// ─────────────────────────────────────────────
function SellerOffersPanel({ itemId, itemTitle, originalPrice, currentUser, onOfferResolved }) {
  const [offers, setOffers] = useState([]);
  const [counterInputs, setCounterInputs] = useState({});
  const [showCounterFor, setShowCounterFor] = useState(null);

  const refresh = useCallback(() => {
    setOffers(getOffersForItem(itemId));
  }, [itemId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (offers.length === 0) return null;

  const handleAccept = (offerId) => {
    acceptOffer(offerId);
    refresh();
    onOfferResolved && onOfferResolved();
  };

  const handleReject = (offerId) => {
    rejectOffer(offerId);
    refresh();
  };

  const handleCounter = (offerId) => {
    const raw = counterInputs[offerId] || "";
    const val = Number(String(raw).replace(/\D/g, ""));
    if (!val || val <= 0) return;
    counterOffer(offerId, val);
    setShowCounterFor(null);
    setCounterInputs((p) => ({ ...p, [offerId]: "" }));
    refresh();
  };

  const statusLabel = {
    pending: { label: "Menunggu respons", color: "bg-amber-100 text-amber-700" },
    counter_buyer: { label: "Buyer ajukan ulang", color: "bg-blue-100 text-blue-700" },
    counter_seller: { label: "Menunggu buyer", color: "bg-purple-100 text-purple-700" },
    accepted: { label: "Deal ✓", color: "bg-emerald-100 text-emerald-700" },
  };

  return (
    <div className="mt-6 w-full border border-amber-200 bg-amber-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-xs font-bold text-amber-800">Penawaran Masuk ({offers.length})</span>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const st = statusLabel[offer.status] || { label: offer.status, color: "bg-gray-100 text-gray-600" };
          const isAccepted = offer.status === "accepted";
          const isCounterSeller = offer.status === "counter_seller";

          return (
            <div key={offer.id} className="bg-white rounded-xl border border-amber-100 p-3.5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-[#1F2A24]">{offer.buyerName}</p>
                  <p className="text-[11px] text-[#718096]">
                    {new Date(offer.updatedAt).toLocaleString("id-ID", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                  {st.label}
                </span>
              </div>

              <p className="text-base font-extrabold text-[#2F7D5B] mb-3">{fmtRp(offer.price)}</p>

              {/* Riwayat negosiasi */}
              {offer.history && offer.history.length > 1 && (
                <div className="mb-3 space-y-1 border-l-2 border-[#E8EEEA] pl-3">
                  {offer.history.slice(-3).map((h, i) => (
                    <p key={i} className="text-[10px] text-[#718096]">
                      <span className={`font-bold ${h.actor === "buyer" ? "text-blue-600" : "text-[#2F7D5B]"}`}>
                        {h.actor === "buyer" ? "Buyer" : "Kamu"}:
                      </span>{" "}
                      {fmtRp(h.price)}
                    </p>
                  ))}
                </div>
              )}

              {!isAccepted && !isCounterSeller && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAccept(offer.id)}
                    className="flex-1 py-1.5 text-[11px] font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg"
                  >
                    ✓ Terima
                  </button>
                  <button
                    onClick={() => setShowCounterFor(showCounterFor === offer.id ? null : offer.id)}
                    className="flex-1 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg"
                  >
                    ↔ Minta Ganti Harga
                  </button>
                  <button
                    onClick={() => handleReject(offer.id)}
                    className="flex-1 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    ✕ Tolak
                  </button>
                </div>
              )}

              {isCounterSeller && (
                <p className="text-[11px] text-purple-600 font-medium">Menunggu respons buyer...</p>
              )}

              {showCounterFor === offer.id && (
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={counterInputs[offer.id] || ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const fmt = raw ? Number(raw).toLocaleString("id-ID") : "";
                        setCounterInputs((p) => ({ ...p, [offer.id]: fmt }));
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#2F7D5B]"
                    />
                  </div>
                  <button
                    onClick={() => handleCounter(offer.id)}
                    className="px-3 py-2 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                  >
                    Kirim
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// KOMPONEN UTAMA: DetailCard
// ─────────────────────────────────────────────
export default function DetailCard({ product, onBack, onNavigate, currentUser, onLogout }) {
  const rawItem = product || {
    id: 1,
    title: "Sepeda Kota Vintage",
    category: "Jual",
    priceText: "Rp750.000",
    price: 750000,
    isExchange: false,
    location: "Wonokromo",
    condition: "Baik",
    image: "/images/vintage-bike.jpg",
    catType: "Hobi",
    status: "Membuka Penawaran",
    description:
      "Sepeda kota warna hijau dengan keranjang depan. Rem dan rantai berfungsi baik, nyaman dipakai untuk aktivitas harian. Ada sedikit bekas pemakaian wajar pada rangka.",
  };

  // Harga awal — bisa dioverride oleh dealPrice dari chat
  const basePrice = rawItem.price || 0;
  const incomingDeal = rawItem.dealPrice || null;

  // ── State ────────────────────────────────────
  const [currentPrice, setCurrentPrice] = useState(incomingDeal || basePrice);
  const [displayPriceText, setDisplayPriceText] = useState(
    incomingDeal ? fmtRp(incomingDeal) : (rawItem.priceText || "")
  );
  const [dealPrice, setDealPrice] = useState(incomingDeal);
  const [isDealDone, setIsDealDone] = useState(!!incomingDeal); // langsung true kalau balik dari chat

  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerModalMode, setOfferModalMode] = useState("new"); // "new" | "counter"
  const [offerInitialPrice, setOfferInitialPrice] = useState(basePrice);

  const [showDealModal, setShowDealModal] = useState(false);
  const [showSellerCounterModal, setShowSellerCounterModal] = useState(false);

  // State penawaran aktif buyer
  const [myOffer, setMyOffer] = useState(null);

  // Chat/Buy modal (existing)
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState(
    `Halo, apakah ${rawItem.title} ini masih tersedia?`
  );
  const [chatSent, setChatSent] = useState(false);

  const galleryImages = [
    rawItem.image || "/images/vintage-bike.jpg",
    "/images/kursi-cafe.jpg",
    "/images/hero-antique.jpg",
  ];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  const isNegotiable = rawItem.category === "Jual" && rawItem.status === "Membuka Penawaran";
  const isSeller = currentUser && (currentUser.role === "admin" || currentUser.username === "budi");

  // ── Poll offer status (buyer side) ──────────
  const pollOfferStatus = useCallback(() => {
    if (!currentUser || !isNegotiable) return;
    const offer = getMyOffer(rawItem.id, currentUser.username);
    setMyOffer(offer);

    if (!offer) return;

    if (offer.status === "accepted" && !isDealDone) {
      setDealPrice(offer.price);
      setShowDealModal(true);
    }

    if (offer.status === "counter_seller" && !showSellerCounterModal) {
      setShowSellerCounterModal(true);
    }

    if (offer.status === "rejected") {
      setMyOffer(null);
    }
  }, [currentUser, isNegotiable, rawItem.id, isDealDone, showSellerCounterModal]);

  useEffect(() => {
    pollOfferStatus();
    const interval = setInterval(pollOfferStatus, 2000);
    return () => clearInterval(interval);
  }, [pollOfferStatus]);

  // ── Handler: submit offer baru / counter dari buyer ──
  const handleSubmitOffer = (price) => {
    if (!currentUser) return;
    const offer = createOffer({
      itemId: rawItem.id,
      buyerId: currentUser.username,
      buyerName: currentUser.fullName || currentUser.username,
      price,
      itemTitle: rawItem.title,
    });
    setMyOffer(offer);
    setShowOfferModal(false);

    // Auto navigate ke chat setelah kirim penawaran
    setTimeout(() => {
      onNavigate && onNavigate("chat", { product: rawItem });
    }, 300);
  };

  // ── Handler: buyer setuju harga counter dari seller ──
  const handleAcceptSellerCounter = () => {
    if (!myOffer) return;
    // Treat as accepted on buyer side — seller sudah kirim counter, buyer terima
    setDealPrice(myOffer.price);
    setShowSellerCounterModal(false);
    setShowDealModal(true);
    // Update offer status jadi accepted
    acceptOffer(myOffer.id, "buyer");
  };

  // ── Handler: buyer ajukan harga lain setelah counter seller ──
  const handleBuyerCounter = (price) => {
    if (!myOffer) return;
    buyerCounterOffer(myOffer.id, price, currentUser?.fullName || currentUser?.username);
    setShowOfferModal(false);
    setShowSellerCounterModal(false);
  };

  // ── Handler: buyer cancel negosiasi ──
  const handleCancelNegotiation = () => {
    if (myOffer) cancelDeal(myOffer.id);
    setMyOffer(null);
    setShowSellerCounterModal(false);
    setShowDealModal(false);
  };

  // ── Handler: buyer konfirmasi lanjut bayar ──
  const handleProceedPayment = () => {
    setIsDealDone(true);
    setCurrentPrice(dealPrice);
    setDisplayPriceText(fmtRp(dealPrice));
    setShowDealModal(false);
    // Scroll ke tombol bayar atau langsung navigate
    setTimeout(() => {
      onNavigate && onNavigate("checkout", { product: { ...rawItem, price: dealPrice, priceText: fmtRp(dealPrice) } });
    }, 300);
  };

  // ── Action button label ──────────────────────
  const getActionLabel = () => {
    if (isDealDone) return "Bayar Sekarang";
    switch (rawItem.category) {
      case "Tukar": return "Ajukan Tukar";
      case "Lelang": return "Ikuti Lelang";
      case "Donasi": return "Minta Donasi";
      case "Jual":
      default:
        return isNegotiable ? "Buka Penawaran" : "Beli Sekarang";
    }
  };

  const handleMainAction = () => {
    if (isDealDone) {
      onNavigate && onNavigate("checkout", { product: { ...rawItem, price: currentPrice, priceText: displayPriceText } });
      return;
    }
    if (rawItem.category === "Jual" && isNegotiable) {
      if (myOffer && myOffer.status === "counter_seller") {
        // Tampilkan modal counter seller
        setShowSellerCounterModal(true);
        return;
      }
      setOfferModalMode("new");
      setOfferInitialPrice(currentPrice);
      setShowOfferModal(true);
      return;
    }
    if (!onNavigate) return;
    if (rawItem.category === "Tukar") onNavigate("ajukan_tukar", { product: rawItem });
    else if (rawItem.category === "Lelang") onNavigate("lelang_detail", { product: rawItem });
    else if (rawItem.category === "Donasi") onNavigate("donasi", { product: rawItem });
    else onNavigate("checkout", { product: rawItem });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatSent(true);
    setTimeout(() => {
      setShowChatModal(false);
      setChatSent(false);
    }, 1500);
  };

  // ── Offer status badge (buyer side) ─────────
  const renderOfferStatusBadge = () => {
    if (!isNegotiable || !myOffer || isSeller) return null;
    const configs = {
      pending: { label: "⏳ Menunggu respons penjual…", color: "bg-amber-50 border-amber-200 text-amber-700" },
      counter_seller: { label: "🔁 Penjual mengusulkan harga lain — klik tombol di bawah", color: "bg-blue-50 border-blue-200 text-blue-700" },
      counter_buyer: { label: "⏳ Menunggu penjual merespons tawaran barumu…", color: "bg-purple-50 border-purple-200 text-purple-700" },
      accepted: { label: "✅ Harga deal! Konfirmasi untuk lanjut bayar.", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    };
    const cfg = configs[myOffer.status];
    if (!cfg) return null;
    return (
      <div className={`w-full rounded-xl border p-3 text-xs font-semibold mb-4 ${cfg.color}`}>
        {cfg.label}
        {myOffer.status !== "pending" && myOffer.status !== "counter_buyer" && (
          <span className="ml-2 font-extrabold">{fmtRp(myOffer.price)}</span>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFFFFF] font-plusJakartaSans text-[#1F2A24]">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Kembali ke beranda"
          >
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none tracking-[-0.0368em]">T</span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">TradeMe</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#1F2A24] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[#2F7D5B] font-bold text-sm hover:underline mb-6 group focus:outline-none"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
          <span>Kembali ke beranda</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ═══ LEFT: GALLERY ═══ */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="w-full aspect-[4/3.2] sm:aspect-[4/3] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#F6FAF7] border border-[#E8EEEA] shadow-sm relative group">
              <img
                src={activeImage}
                alt={rawItem.title}
                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-102"
              />
            </div>
            <div className="flex items-center gap-3.5 mt-4">
              {galleryImages.map((imgSrc, idx) => {
                const isActive = activeImage === imgSrc;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgSrc)}
                    className={`w-[78px] h-[78px] sm:w-[86px] sm:h-[86px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 relative ${
                      isActive
                        ? "border-2 border-[#2F7D5B] ring-2 ring-[#2F7D5B]/20 scale-102 shadow-sm"
                        : "border border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300"
                    }`}
                  >
                    <img src={imgSrc} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover object-center" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ RIGHT: DETAIL & CTA ═══ */}
          <div className="lg:col-span-6 flex flex-col items-start">
            {/* Badges */}
            <div className="flex items-center flex-wrap gap-2.5 mb-3.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EAF5EF] text-[#2F7D5B]">
                {rawItem.category || "Jual"}
              </span>
              {/* Status "Membuka Penawaran" hanya tampil jika memang negotiable */}
              {isNegotiable && (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  {rawItem.status}
                </span>
              )}
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F2] text-[#4A5568]">
                Kondisi {rawItem.condition ? rawItem.condition.toLowerCase() : "baik"}
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F2] text-[#4A5568]">
                {rawItem.catType || "Hobi"}
              </span>
            </div>

            <h1 className="text-[30px] sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-2">
              {rawItem.title}
            </h1>

            <div className="flex items-center gap-1.5 text-sm text-[#718096] mb-4">
              <svg className="w-4 h-4 text-[#718096] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{rawItem.location || "Wonokromo"}, Surabaya · diunggah 2 jam lalu</span>
            </div>

            {/* Harga */}
            {rawItem.category !== "Donasi" && (
              <div className="mb-2">
                <div className="text-[28px] sm:text-[34px] font-bold text-[#2F7D5B] leading-none tracking-tight">
                  {displayPriceText || rawItem.priceText || "Rp0"}
                </div>
                {isDealDone && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✅ Harga deal disepakati
                  </p>
                )}
              </div>
            )}

            {/* Offer status badge (buyer) */}
            <div className="w-full mt-2 mb-2">
              {renderOfferStatusBadge()}
            </div>

            <p className="text-[#516057] text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
              {rawItem.description || "Deskripsi barang..."}
            </p>

            {/* Seller card */}
            <div className="w-full rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between bg-white shadow-xs mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-base flex items-center justify-center shrink-0 shadow-inner">
                  BS
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-[#1F2A24]">
                    <span>Budi Santoso</span>
                    <svg className="w-4 h-4 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Terverifikasi">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">Anggota sejak 2022 · 24 barang terjual</p>
                </div>
              </div>
              <div className="bg-[#FFF9EB] text-[#B45309] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#FDE68A] flex items-center gap-1">
                <span>4,9</span>
                <span className="text-[#F59E0B]">★</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="w-full flex items-center gap-3.5 mb-4">
              <button
                type="button"
                onClick={handleMainAction}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-base shadow-md transition-all text-center cursor-pointer text-white ${
                  isDealDone
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                    : "bg-[#2F7D5B] hover:bg-[#25664a] shadow-[#2F7D5B]/20"
                } active:scale-[0.99] hover:shadow-lg`}
              >
                {getActionLabel()}
              </button>

              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="py-3.5 px-6 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1F2A24] font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#1F2A24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat Pemilik</span>
              </button>
            </div>

            {/* Escrow Guarantee */}
            <div className="w-full rounded-xl p-4 bg-[#EBF5EF] border border-[#D2E7DA] flex items-start gap-3">
              <svg className="w-5 h-5 text-[#2F7D5B] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-[#1F2A24] leading-snug">Transaksi aman dengan escrow</h4>
                <p className="text-xs text-[#516057] mt-0.5">Dana baru diteruskan setelah barang kamu terima.</p>
              </div>
            </div>

            {/* ═══ SELLER OFFERS PANEL (hanya tampil untuk penjual / admin) ═══ */}
            {isSeller && isNegotiable && (
              <SellerOffersPanel
                itemId={rawItem.id}
                itemTitle={rawItem.title}
                originalPrice={basePrice}
                currentUser={currentUser}
                onOfferResolved={() => {}}
              />
            )}
          </div>
        </div>

        {/* ═══ ESTIMATED LOCATION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 mt-12 sm:mt-16">
          <div className="lg:col-span-5 flex flex-col items-start">
            <span className="text-[#2F7D5B] font-extrabold text-[11px] tracking-[0.16em] uppercase mb-2">
              Perkiraan Lokasi
            </span>
            <h2 className="text-2xl sm:text-[28px] font-bold text-[#1F2A24] leading-tight mb-2">
              Lokasi pengambilan barang
            </h2>
            <p className="text-sm text-[#718096] leading-relaxed max-w-sm">
              Lokasi tepat akan dibagikan setelah transaksi disetujui.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="relative w-full h-52 sm:h-60 rounded-3xl bg-[#E8F1EC] border border-[#D5E5DC] overflow-hidden flex items-center justify-center shadow-inner">
              <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="30%" x2="100%" y2="70%" stroke="#C7DDD1" strokeWidth="8" />
                <line x1="0" y1="80%" x2="100%" y2="20%" stroke="#C7DDD1" strokeWidth="6" />
                <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#D3E5DC" strokeWidth="4" />
                <line x1="75%" y1="0" x2="35%" y2="100%" stroke="#D3E5DC" strokeWidth="5" />
                <circle cx="50%" cy="50%" r="60" fill="none" stroke="#BFD7C9" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="100" fill="none" stroke="#D3E5DC" strokeWidth="1.5" />
              </svg>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center shadow-lg shadow-[#2F7D5B]/35 ring-4 ring-white/80 transition-transform hover:scale-110">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md border border-gray-100 z-20">
                <span className="text-[11px] font-bold text-[#1F2A24] block">Lokasi barang</span>
                <span className="text-[11px] text-[#718096] block">{rawItem.location || "Wonokromo"}, Surabaya</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-[#E8EEEA] pt-10 pb-12 mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold leading-none">T</span>
              </div>
              <span className="text-[#1F2A24] text-[20px] font-extrabold tracking-tight">TradeMe</span>
              <span className="text-sm text-[#718096] hidden md:inline ml-3">Memberi nilai baru pada barang lama.</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
              <button type="button" onClick={onBack} className="hover:text-[#2F7D5B] transition-colors focus:outline-none">Donasi</button>
              <button type="button" onClick={onBack} className="hover:text-[#2F7D5B] transition-colors focus:outline-none">Profil</button>
              <button type="button" onClick={() => onLogout && onLogout()} className="hover:text-red-600 transition-colors focus:outline-none">Keluar</button>
            </div>
          </div>
          <div className="text-xs text-[#8A948E] pt-2 border-t border-[#F0F4F1]">
            © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
          </div>
        </footer>
      </main>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* 1. Offer Modal (buyer ajukan / balas harga) */}
      <OfferModal
        open={showOfferModal}
        initialPrice={offerInitialPrice}
        maxPrice={basePrice}
        mode={offerModalMode}
        onClose={() => setShowOfferModal(false)}
        onSubmit={offerModalMode === "counter" ? handleBuyerCounter : handleSubmitOffer}
      />

      {/* 2. Seller Counter Modal (buyer melihat harga usulan penjual) */}
      {myOffer && (
        <SellerCounterModal
          open={showSellerCounterModal && myOffer.status === "counter_seller"}
          counterPrice={myOffer.price}
          originalPrice={basePrice}
          onReject={handleCancelNegotiation}
          onAccept={handleAcceptSellerCounter}
          onCounter={() => {
            setShowSellerCounterModal(false);
            setOfferModalMode("counter");
            setOfferInitialPrice(myOffer.price);
            setShowOfferModal(true);
          }}
        />
      )}

      {/* 3. Deal Confirm Modal (buyer terima -> lanjut bayar?) */}
      <DealConfirmModal
        open={showDealModal}
        dealPrice={dealPrice}
        onCancel={handleCancelNegotiation}
        onProceed={handleProceedPayment}
      />

      {/* 4. Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative border border-[#DCE6DF]">
            <button onClick={() => setShowChatModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-sm flex items-center justify-center">BS</div>
              <div>
                <h3 className="font-bold text-[#1F2A24] text-sm">Budi Santoso</h3>
                <p className="text-[11px] text-[#718096]">Biasanya membalas dalam beberapa menit</p>
              </div>
            </div>

            {chatSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Pesan berhasil dikirim ke pemilik barang!</span>
              </div>
            ) : (
              <form onSubmit={handleSendChat} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">Pesan untuk Pemilik Barang</label>
                  <textarea
                    rows="3"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/20"
                    placeholder="Tulis pesanmu..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowChatModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg shadow-sm">Kirim Pesan</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
