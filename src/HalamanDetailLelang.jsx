import React, { useState, useEffect } from 'react';

const HalamanDetailLelang = ({ product, onBack, onNavigate, currentUser, onLogout }) => {
  // Data item lelang dengan fallback default sesuai Figma
  const defaultImages = [
    product?.image || "/images/kursi-cafe.jpg",
    "/images/hero-antique.jpg",
    "/images/meja-jati.jpg"
  ];

  const item = {
    id: product?.id || 3,
    title: product?.title || "Kursi Cafe Minimalis",
    category: "Lelang",
    startPrice: 280000,
    currentBid: 450000,
    bidCount: 12,
    location: product?.location || "Sukolilo, Surabaya",
    description: product?.description || "Satu set empat kursi cafe kayu solid. Struktur kokoh dengan bekas pemakaian ringan.",
    seller: product?.seller || "Budi Santoso",
    images: defaultImages
  };

  const [currentHighestBid, setCurrentHighestBid] = useState(item.currentBid);
  const [totalBids, setTotalBids] = useState(item.bidCount);
  const minIncrement = 15000;
  const [bidInput, setBidInput] = useState(item.currentBid + minIncrement);
  const [activeImage, setActiveImage] = useState(item.images[0]);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [showBidSuccessModal, setShowBidSuccessModal] = useState(false);

  // Riwayat penawaran persis sesuai data Figma
  const [bidHistory, setBidHistory] = useState([
    { id: 1, user: "R***a", initial: "R", amount: 450000, time: "10:42", isMe: false },
    { id: 2, user: "D***i", initial: "D", amount: 420000, time: "10:18", isMe: false },
    { id: 3, user: "A***a", initial: "A", amount: 390000, time: "09:51", isMe: false }
  ]);

  // Countdown timer (02 Hari : 14 Jam : 38 Menit)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 0
  });

  useEffect(() => {
    // Timer interval countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Sinkronisasi input minimal penawaran jika tawaran tertinggi berubah
    setBidInput(currentHighestBid + minIncrement);
  }, [currentHighestBid]);

  // Handle pengajuan penawaran baru
  const handleAjukanPenawaran = (e) => {
    e.preventDefault();
    const inputVal = Number(bidInput);
    const minRequired = currentHighestBid + minIncrement;

    if (isNaN(inputVal) || inputVal < minRequired) {
      alert(`Penawaran minimal adalah Rp${minRequired.toLocaleString('id-ID')}`);
      return;
    }

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBid = {
      id: Date.now(),
      user: currentUser?.name ? `${currentUser.name.slice(0, 1)}***${currentUser.name.slice(-1)}` : "A***a",
      initial: currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A",
      amount: inputVal,
      time: timeString,
      isMe: true
    };

    setBidHistory([newBid, ...bidHistory]);
    setCurrentHighestBid(inputVal);
    setTotalBids(prev => prev + 1);
    setShowBidSuccessModal(true);
  };

  // Format currency rupiah
  const formatRupiah = (val) => {
    return `Rp${Number(val).toLocaleString('id-ID')}`;
  };

  // Navigasi "Ambil Harga Saat Ini" menuju proses Checkout Escrow
  const handleProceedBuyNow = () => {
    setShowBuyNowModal(false);
    if (onNavigate) {
      onNavigate("checkout", {
        product: {
          ...item,
          priceText: formatRupiah(currentHighestBid),
          price: currentHighestBid,
          isInstantAuctionBuy: true
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1F2A24] antialiased">
      {/* ================= TOP NAVBAR (SESUAI FIGMA) ================= */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          
          {/* Logo & Tombol Kembali */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack || (() => onNavigate && onNavigate("home"))}
              className="flex items-center gap-2.5 text-gray-800 hover:opacity-80 transition-opacity"
              title="Kembali ke Beranda"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2F7D5B] text-white font-black flex items-center justify-center text-lg shadow-sm">
                T
              </div>
              <span className="font-bold text-xl tracking-tight text-[#1F2A24]">TradeMe</span>
            </button>
          </div>

          {/* Search Bar Tengah */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="w-full relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari barang di Surabaya..."
                readOnly
                onClick={() => onNavigate && onNavigate("home")}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F4F6F5] border border-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Navigasi Kanan */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate && onNavigate("home")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#2F7D5B] hover:bg-[#25684B] text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <span>+</span>
              <span>Unggah Barang</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate("chat", { product: item })}
              className="relative p-2.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5"
              title="Pesan Masuk"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Chat</span>
              <span className="absolute -top-1 -right-1 sm:top-1 sm:right-auto sm:-left-1 w-4 h-4 rounded-full bg-[#E53E3E] text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "P"}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-800">
                {currentUser?.name || "Profil"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* ================= KONTEN UTAMA DUA KOLOM ================= */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8">
        
        {/* Tombol kembali mobile / breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={onBack || (() => onNavigate && onNavigate("home"))}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#2F7D5B] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= KOLOM KIRI: FOTO & DESKRIPSI ================= */}
          <div className="lg:col-span-6 space-y-4">
            {/* Foto Utama */}
            <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
              <img 
                src={activeImage} 
                alt={item.title} 
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* 3 Thumbnail Foto */}
            <div className="flex gap-3">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === img 
                      ? "border-[#2F7D5B] shadow-sm scale-102" 
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Deskripsi Barang Sesuai Figma */}
            <div className="pt-2 text-[#4A5568] text-sm sm:text-base leading-relaxed">
              <p>{item.description}</p>
            </div>
          </div>

          {/* ================= KOLOM KANAN: KONTROL LELANG ================= */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Judul Produk */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {item.title}
            </h1>

            {/* CARD 1: TAWARAN TERTINGGI SAAT INI (KUNING / KREM FIGMA) */}
            <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-[22px] p-6 sm:p-7 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-[#854D0E] mb-1">
                Tawaran tertinggi saat ini
              </p>
              
              <div className="text-3xl sm:text-[38px] font-black text-[#713F12] tracking-tight mb-1">
                {formatRupiah(currentHighestBid)}
              </div>
              
              <p className="text-xs sm:text-sm text-[#854D0E] opacity-90 mb-6">
                Harga awal {formatRupiah(item.startPrice)} · {totalBids} penawaran
              </p>

              {/* Countdown Timer (Hari : Jam : Menit) */}
              <div className="flex items-center justify-center gap-3">
                {/* Box Hari */}
                <div className="bg-white rounded-xl px-5 py-3 text-center min-w-[72px] shadow-xs border border-[#FEF08A]">
                  <div className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">Hari</div>
                </div>

                <div className="text-xl font-bold text-[#854D0E]">:</div>

                {/* Box Jam */}
                <div className="bg-white rounded-xl px-5 py-3 text-center min-w-[72px] shadow-xs border border-[#FEF08A]">
                  <div className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">Jam</div>
                </div>

                <div className="text-xl font-bold text-[#854D0E]">:</div>

                {/* Box Menit */}
                <div className="bg-white rounded-xl px-5 py-3 text-center min-w-[72px] shadow-xs border border-[#FEF08A]">
                  <div className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">Menit</div>
                </div>
              </div>
            </div>

            {/* CARD 2: FORM AJUKAN PENAWARAN (CARD PUTIH) */}
            <div className="bg-white rounded-[22px] border border-gray-200 p-6 sm:p-7 shadow-xs">
              <h3 className="font-bold text-base text-[#111827] mb-3">
                Ajukan penawaran
              </h3>

              <form onSubmit={handleAjukanPenawaran} className="space-y-2">
                <div className="relative flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#F1B33B] focus-within:ring-2 focus-within:ring-[#FDE68A] transition-all">
                  <span className="text-sm font-semibold text-gray-600 mr-2 select-none">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    className="w-full font-bold text-base text-[#1F2937] outline-none bg-transparent"
                    placeholder="465000"
                  />
                </div>

                <p className="text-xs text-gray-400 pl-1 pb-2">
                  Minimal penawaran {formatRupiah(currentHighestBid + minIncrement)}
                </p>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#F1B33B] hover:bg-[#E5A42A] active:scale-[0.99] text-[#1F2A24] font-bold text-sm sm:text-base rounded-xl transition-all shadow-xs"
                >
                  Ajukan Penawaran
                </button>
              </form>
            </div>

            {/* CARD 3: RIWAYAT PENAWARAN (CARD PUTIH) */}
            <div className="bg-white rounded-[22px] border border-gray-200 p-6 sm:p-7 shadow-xs">
              <h3 className="font-bold text-base text-[#111827] mb-4">
                Riwayat penawaran
              </h3>

              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {bidHistory.map((bid) => (
                  <div 
                    key={bid.id} 
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
                  >
                    {/* User Inisial & Nama */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2F7D5B] font-bold text-xs flex items-center justify-center">
                        {bid.initial}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {bid.user}
                      </span>
                    </div>

                    {/* Nominal & Waktu */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {formatRupiah(bid.amount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {bid.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= FITUR BARU: AMBIL HARGA SAAT INI & CHAT PENJUAL ================= */}
            <div className="pt-2 space-y-3">
              {/* Tombol Ambil Harga Saat Ini (Fitur Baru) */}
              <button
                type="button"
                onClick={() => setShowBuyNowModal(true)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#2F7D5B] hover:bg-[#25684B] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Ambil Harga Saat Ini ({formatRupiah(currentHighestBid)})</span>
              </button>

              {/* Tombol Chat Penjual Sesuai Figma */}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("chat", { product: item })}
                className="w-full py-3.5 px-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99] text-gray-700 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>Chat Penjual</span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* ================= MODAL KONFIRMASI AMBIL HARGA SAAT INI ================= */}
      {showBuyNowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#2F7D5B] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Ambil Harga Saat Ini?
            </h3>
            
            <p className="text-sm text-center text-gray-500 mb-6 leading-relaxed">
              Anda akan memenangkan dan membeli langsung <strong>{item.title}</strong> pada harga tawaran tertinggi saat ini tanpa harus menunggu waktu lelang berakhir.
            </p>

            <div className="bg-[#F8FAF9] rounded-xl p-4 mb-6 border border-gray-100">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500">Barang</span>
                <span className="font-semibold text-gray-800">{item.title}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Harga Beli Instan</span>
                <span className="font-extrabold text-[#2F7D5B] text-base">{formatRupiah(currentHighestBid)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowBuyNowModal(false)}
                className="py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProceedBuyNow}
                className="py-3 rounded-xl bg-[#2F7D5B] text-white font-bold hover:bg-[#25684B] transition-colors shadow-sm"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUKSES PENAWARAN ================= */}
      {showBidSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              Penawaran Berhasil Diajukan!
            </h4>
            <p className="text-sm text-gray-500 mb-5">
              Anda kini menjadi penawar tertinggi dengan nilai <strong>{formatRupiah(currentHighestBid)}</strong>.
            </p>
            <button
              onClick={() => setShowBidSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#F1B33B] text-[#1F2A24] font-bold text-sm hover:bg-[#E5A42A] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HalamanDetailLelang;
