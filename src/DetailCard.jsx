import React, { useState } from "react";

export default function DetailCard({ product, onBack, onNavigate, currentUser, onLogout }) {
  // Fallback defaults if clicked product has partial data
  const item = product || {
    id: 1,
    title: "Sepeda Kota Vintage",
    category: "Jual",
    priceText: "Rp750.000",
    isExchange: false,
    location: "Wonokromo",
    condition: "Baik",
    image: "/images/vintage-bike.jpg",
    catType: "Hobi",
    description:
      "Sepeda kota warna hijau dengan keranjang depan. Rem dan rantai berfungsi baik, nyaman dipakai untuk aktivitas harian. Ada sedikit bekas pemakaian wajar pada rangka.",
  };

  // Gallery thumbnails
  const galleryImages = [
    item.image || "/images/vintage-bike.jpg",
    "/images/kursi-cafe.jpg",
    "/images/hero-antique.jpg",
  ];

  const [activeImage, setActiveImage] = useState(galleryImages[0]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [chatMessage, setChatMessage] = useState(
    `Halo, apakah ${item.title} ini masih tersedia?`
  );
  const [chatSent, setChatSent] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  // Map action button based on category
  const getActionLabel = () => {
    switch (item.category) {
      case "Tukar":
        return "Ajukan Tukar";
      case "Lelang":
        return "Ikuti Lelang";
      case "Donasi":
        return "Minta Donasi";
      case "Jual":
      default:
        return "Beli Sekarang";
    }
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

  const handleConfirmBuy = () => {
    setBuySuccess(true);
    setTimeout(() => {
      setShowBuyModal(false);
      setBuySuccess(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-plusJakartaSans text-[#1F2A24]">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Kembali ke beranda"
          >
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none tracking-[-0.0368em]">
                T
              </span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">
              TradeMe
            </span>
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#1F2A24] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[#2F7D5B] font-bold text-sm hover:underline mb-6 group focus:outline-none"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
          <span>Kembali ke beranda</span>
        </button>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ================= LEFT: IMAGE GALLERY ================= */}
          <div className="lg:col-span-6 flex flex-col items-start">
            {/* Main Active Image */}
            <div className="w-full aspect-[4/3.2] sm:aspect-[4/3] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#F6FAF7] border border-[#E8EEEA] shadow-sm relative group">
              <img
                src={activeImage}
                alt={item.title}
                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-102"
              />
            </div>

            {/* Thumbnail Row */}
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
                    <img
                      src={imgSrc}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= RIGHT: PRODUCT DETAILS & CTA ================= */}
          <div className="lg:col-span-6 flex flex-col items-start">
            {/* Category, Condition, and Tag Pills */}
            <div className="flex items-center flex-wrap gap-2.5 mb-3.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EAF5EF] text-[#2F7D5B]">
                {item.category || "Jual"}
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F2] text-[#4A5568]">
                Kondisi {item.condition ? item.condition.toLowerCase() : "baik"}
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F2] text-[#4A5568]">
                {item.catType || "Hobi"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[30px] sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-2">
              {item.title}
            </h1>

            {/* Location & Timestamp */}
            <div className="flex items-center gap-1.5 text-sm text-[#718096] mb-4">
              <svg
                className="w-4 h-4 text-[#718096] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {item.location || "Wonokromo"}, Surabaya · diunggah 2 jam lalu
              </span>
            </div>

            {/* Price */}
            <div className="text-[28px] sm:text-[34px] font-bold text-[#2F7D5B] leading-none mb-5 tracking-tight">
              {item.priceText || "Rp750.000"}
            </div>

            {/* Description Paragraph */}
            <p className="text-[#516057] text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
              {item.description ||
                "Sepeda kota warna hijau dengan keranjang depan. Rem dan rantai berfungsi baik, nyaman dipakai untuk aktivitas harian. Ada sedikit bekas pemakaian wajar pada rangka."}
            </p>

            {/* Seller / Owner Profile Card */}
            <div className="w-full rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between bg-white shadow-xs mb-5">
              <div className="flex items-center gap-3.5">
                {/* Avatar with Initials */}
                <div className="w-12 h-12 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-base flex items-center justify-center shrink-0 shadow-inner">
                  BS
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-[#1F2A24]">
                    <span>Budi Santoso</span>
                    <svg
                      className="w-4 h-4 text-[#2F7D5B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      title="Terverifikasi"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">
                    Anggota sejak 2022 · 24 barang terjual
                  </p>
                </div>
              </div>

              {/* Rating Pill */}
              <div className="bg-[#FFF9EB] text-[#B45309] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#FDE68A] flex items-center gap-1">
                <span>4,9</span>
                <span className="text-[#F59E0B]">★</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="w-full flex items-center gap-3.5 mb-4">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate("checkout", { product: item });
                  } else {
                    setShowBuyModal(true);
                  }
                }}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-[#2F7D5B]/20 hover:shadow-lg transition-all text-center cursor-pointer"
              >
                {getActionLabel()}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate("chat", { product: item });
                  } else {
                    setShowChatModal(true);
                  }
                }}
                className="py-3.5 px-6 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1F2A24] font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5 text-[#1F2A24]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>Chat Pemilik</span>
              </button>
            </div>

            {/* Escrow Guarantee Card */}
            <div className="w-full rounded-xl p-4 bg-[#EBF5EF] border border-[#D2E7DA] flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[#2F7D5B] shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-[#1F2A24] leading-snug">
                  Transaksi aman dengan escrow
                </h4>
                <p className="text-xs text-[#516057] mt-0.5">
                  Dana baru diteruskan setelah barang kamu terima.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-[#E8EEEA] my-12 sm:my-16" />

        {/* ================= ESTIMATED LOCATION SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          {/* Left Column: Text */}
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

          {/* Right Column: Stylized Map Card */}
          <div className="lg:col-span-7">
            <div className="relative w-full h-52 sm:h-60 rounded-3xl bg-[#E8F1EC] border border-[#D5E5DC] overflow-hidden flex items-center justify-center shadow-inner">
              {/* Decorative Map Grid & Roads SVG */}
              <svg
                className="absolute inset-0 w-full h-full opacity-60"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="0" y1="30%" x2="100%" y2="70%" stroke="#C7DDD1" strokeWidth="8" />
                <line x1="0" y1="80%" x2="100%" y2="20%" stroke="#C7DDD1" strokeWidth="6" />
                <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#D3E5DC" strokeWidth="4" />
                <line x1="75%" y1="0" x2="35%" y2="100%" stroke="#D3E5DC" strokeWidth="5" />
                <circle cx="50%" cy="50%" r="60" fill="none" stroke="#BFD7C9" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="100" fill="none" stroke="#D3E5DC" strokeWidth="1.5" />
              </svg>

              {/* Map Center Pin Marker */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center shadow-lg shadow-[#2F7D5B]/35 ring-4 ring-white/80 transition-transform hover:scale-110">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Floating Location Badge on Bottom-Left */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md border border-gray-100 z-20">
                <span className="text-[11px] font-bold text-[#1F2A24] block">
                  Lokasi barang
                </span>
                <span className="text-[11px] text-[#718096] block">
                  {item.location || "Wonokromo"}, Surabaya
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-[#E8EEEA] pt-10 pb-12 mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
            {/* Brand + Tagline */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold leading-none">
                  T
                </span>
              </div>
              <span className="text-[#1F2A24] text-[20px] font-extrabold tracking-tight">
                TradeMe
              </span>
              <span className="text-sm text-[#718096] hidden md:inline ml-3">
                Memberi nilai baru pada barang lama.
              </span>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Donasi
              </button>
              <button
                type="button"
                onClick={onBack}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Profil
              </button>
              <button
                type="button"
                onClick={() => onLogout && onLogout()}
                className="hover:text-red-600 transition-colors focus:outline-none"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8A948E] pt-2 border-t border-[#F0F4F1]">
            © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
          </div>
        </footer>
      </main>

      {/* ================= CHAT PEMILIK MODAL ================= */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative border border-[#DCE6DF]">
            <button
              onClick={() => setShowChatModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Tutup"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-sm flex items-center justify-center">
                BS
              </div>
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
                  <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
                    Pesan untuk Pemilik Barang
                  </label>
                  <textarea
                    rows="3"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/20"
                    placeholder="Tulis pesanmu..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg shadow-sm"
                  >
                    Kirim Pesan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= BELI / TRANSAKSI MODAL ================= */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative border border-[#DCE6DF]">
            <button
              onClick={() => setShowBuyModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Tutup"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-[#1F2A24] mb-3">
              Konfirmasi {getActionLabel()}
            </h3>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
              <img
                src={item.image || "/images/vintage-bike.jpg"}
                alt={item.title}
                className="w-14 h-14 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-bold text-xs text-[#1F2A24]">{item.title}</h4>
                <p className="text-xs font-extrabold text-[#2F7D5B] mt-0.5">
                  {item.priceText}
                </p>
                <p className="text-[11px] text-[#718096]">
                  {item.location}, Surabaya
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#EBF5EF] rounded-xl text-xs text-[#2F7D5B] font-medium flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Dilindungi TradeMe Escrow. Aman sampai barang diterima.</span>
            </div>

            {buySuccess ? (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">Permintaan berhasil diproses! Pemilik akan segera menghubungi Anda.</span>
              </div>
            ) : (
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBuy}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-xl shadow-md transition-all"
                >
                  Lanjutkan Transaksi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

