import React, { useState, useEffect, useCallback } from "react";
import { getMyOffer, getOffersForItem, acceptOffer, OFFERS_STORAGE_KEY } from "./utils/negotiation";
import { getSellerOf, isSellerUser, conversationId } from "./utils/chat";
import BackButton from "./components/BackButton";
import GoogleMap from "./components/GoogleMap";

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function fmtRp(num) {
  return "Rp" + Number(num || 0).toLocaleString("id-ID");
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

const OFFER_STATUS_LABEL = {
  pending: { label: "Menunggu respons", color: "bg-amber-100 text-amber-700" },
  counter_buyer: { label: "Pembeli menawar lagi", color: "bg-amber-100 text-amber-700" },
  counter_seller: { label: "Menunggu pembeli", color: "bg-purple-100 text-purple-700" },
  accepted: { label: "Deal · menunggu bayar", color: "bg-emerald-100 text-emerald-700" },
};

// ─────────────────────────────────────────────
// KOMPONEN UTAMA: DetailCard
// Negosiasi harga sepenuhnya berjalan di halaman Chat;
// halaman ini hanya menampilkan status dan mengarahkan ke chat.
// ─────────────────────────────────────────────
export default function DetailCard({ product, onBack, onGoBack, onNavigate, currentUser, onLogout }) {
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

  const basePrice = Number(rawItem.price) || 0;
  const seller = getSellerOf(rawItem);
  const isNegotiable = rawItem.category === "Jual" && rawItem.status === "Membuka Penawaran";
  const isSeller = isSellerUser(currentUser, rawItem);

  // ── Baca ulang status penawaran secara berkala (diubah dari halaman chat / tab lain) ──
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    if (!isNegotiable) return;
    const interval = setInterval(refresh, 2000);
    const onStorage = (e) => (!e.key || e.key === OFFERS_STORAGE_KEY) && refresh();
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [isNegotiable, refresh]);

  const myOffer = currentUser && !isSeller && isNegotiable ? getMyOffer(rawItem.id, currentUser.username) : null;
  const incomingOffers = isSeller && isNegotiable ? getOffersForItem(rawItem.id) : [];
  const dealPrice = myOffer?.status === "accepted" ? myOffer.price : null;
  const displayPriceText = dealPrice ? fmtRp(dealPrice) : rawItem.priceText || fmtRp(basePrice);

  const galleryImages = [
    rawItem.image || "/images/vintage-bike.jpg",
    "/images/kursi-cafe.jpg",
    "/images/hero-antique.jpg",
  ];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  // ── Buka halaman chat (wajib login) ──
  const goToChat = (opts = {}) => {
    if (!onNavigate) return;
    if (!currentUser) {
      onNavigate("login", { initialNotice: "Masuk dulu untuk mengobrol atau menawar harga dengan penjual." });
      return;
    }
    onNavigate("chat", { product: rawItem, ...opts });
  };

  const checkoutDeal = (offer) =>
    onNavigate &&
    onNavigate("checkout", {
      product: { ...rawItem, price: offer.price, priceText: fmtRp(offer.price), dealPrice: offer.price, offerId: offer.id },
    });

  const goToCheckout = () => {
    if (!onNavigate) return;
    if (dealPrice) checkoutDeal(myOffer);
    else onNavigate("checkout", { product: rawItem });
  };

  // Pembeli menyetujui harga usulan penjual → langsung ke pembayaran
  const acceptCounterAndPay = () => {
    const accepted = acceptOffer(myOffer.id, "buyer");
    if (accepted) checkoutDeal(accepted);
  };

  const waitingSeller = myOffer && ["pending", "counter_buyer"].includes(myOffer.status);

  // ── Tombol utama ──────────────────────────────
  const getActionLabel = () => {
    if (isSeller) return incomingOffers.length ? `Lihat Penawaran (${incomingOffers.length})` : "Lihat Pesan";
    switch (rawItem.category) {
      case "Tukar": return "Ajukan Tukar";
      case "Lelang": return "Ikuti Lelang";
      case "Donasi": return "Minta Donasi";
      case "Jual":
      default:
        if (!isNegotiable) return "Beli Sekarang";
        if (dealPrice) return "Lanjutkan Pembayaran";
        if (myOffer?.status === "counter_seller") return `Setuju & Bayar ${fmtRp(myOffer.price)}`;
        if (waitingSeller) return "Menunggu Respons Penjual";
        return "Buka Penawaran";
    }
  };

  const handleMainAction = () => {
    if (isSeller) return goToChat();
    if (rawItem.category === "Jual" && isNegotiable) {
      if (dealPrice) return goToCheckout();
      if (myOffer?.status === "counter_seller") return acceptCounterAndPay();
      // Belum ada tawaran → buka chat dengan form tawar; masih menunggu penjual → buka chat
      return goToChat({ openOffer: !myOffer });
    }
    if (!onNavigate) return;
    if (rawItem.category === "Tukar") onNavigate("ajukan_tukar", { product: rawItem });
    else if (rawItem.category === "Lelang") onNavigate("lelang_detail", { product: rawItem });
    else if (rawItem.category === "Donasi") onNavigate("donasi", { product: rawItem });
    else goToCheckout();
  };

  // ── Status negosiasi (sisi pembeli) ─────────
  const renderOfferStatusBadge = () => {
    if (!myOffer) return null;
    const configs = {
      pending: { label: `⏳ Tawaranmu ${fmtRp(myOffer.price)} menunggu respons penjual.`, color: "bg-amber-50 border-amber-200 text-amber-700" },
      counter_buyer: { label: `⏳ Tawaranmu ${fmtRp(myOffer.price)} menunggu respons penjual.`, color: "bg-amber-50 border-amber-200 text-amber-700" },
      counter_seller: { label: `🔁 Penjual mengusulkan ${fmtRp(myOffer.price)}. Setujui untuk langsung bayar, atau tawar lagi di chat.`, color: "bg-purple-50 border-purple-200 text-purple-700" },
      accepted: { label: `✅ Harga deal ${fmtRp(myOffer.price)} — pembayaran belum diselesaikan.`, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    };
    const cfg = configs[myOffer.status];
    if (!cfg) return null;
    return (
      <div className={`w-full rounded-xl border p-3 text-xs font-semibold mb-4 flex items-center justify-between gap-3 ${cfg.color}`}>
        <span>{cfg.label}</span>
        <button type="button" onClick={() => goToChat()} className="underline font-bold shrink-0">
          {myOffer.status === "counter_seller" ? "Tawar lagi" : "Buka chat"}
        </button>
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
          <div className="flex items-center gap-3">
          <BackButton onClick={onGoBack} />
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Ke beranda"
          >
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none tracking-[-0.0368em]">T</span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">TradeMe</span>
          </button>
          </div>
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
                {dealPrice && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✅ Harga deal hasil negosiasi · <span className="line-through text-[#718096] font-normal">{rawItem.priceText || fmtRp(basePrice)}</span>
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
                  {initials(seller.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-[#1F2A24]">
                    <span>{seller.name}</span>
                    <svg className="w-4 h-4 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Terverifikasi">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">{isSeller ? "Ini barangmu" : "Pemilik barang"}</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="w-full flex items-center gap-3.5 mb-4">
              <button
                type="button"
                onClick={handleMainAction}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-base shadow-md transition-all text-center cursor-pointer text-white ${
                  dealPrice
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                    : "bg-[#2F7D5B] hover:bg-[#25664a] shadow-[#2F7D5B]/20"
                } active:scale-[0.99] hover:shadow-lg`}
              >
                {getActionLabel()}
              </button>

              {!isSeller && <button
                type="button"
                onClick={() => goToChat()}
                className="py-3.5 px-6 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1F2A24] font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#1F2A24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat Pemilik</span>
              </button>}
            </div>
            {isNegotiable && !isSeller && !myOffer && (
              <p className="w-full text-[11px] text-[#718096] -mt-2 mb-4">
                Tawar harga langsung lewat chat dengan pemilik barang.
              </p>
            )}

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
              <div className="mt-6 w-full border border-amber-200 bg-amber-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-3">
                  Penawaran Masuk ({incomingOffers.length})
                </p>
                {incomingOffers.length === 0 ? (
                  <p className="text-[11px] text-amber-700">Belum ada tawaran aktif untuk barang ini.</p>
                ) : (
                  <div className="space-y-2">
                    {incomingOffers.map((offer) => {
                      const st = OFFER_STATUS_LABEL[offer.status] || { label: offer.status, color: "bg-gray-100 text-gray-600" };
                      return (
                        <div key={offer.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1F2A24] truncate">{offer.buyerName}</p>
                            <p className="text-sm font-extrabold text-[#2F7D5B]">{fmtRp(offer.price)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                            <button
                              type="button"
                              onClick={() => goToChat({ conversationId: conversationId(rawItem.id, offer.buyerId) })}
                              className="text-[11px] font-bold text-[#2F7D5B] hover:underline"
                            >
                              Balas di Chat →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
            <GoogleMap
              query={`${rawItem.location || "Wonokromo"}, Surabaya`}
              zoom={14}
              height={260}
              title={`Perkiraan lokasi ${rawItem.title}`}
            />
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

    </div>
  );
}
