import React, { useState, useEffect, useCallback } from 'react';
import { auctionBids, auctionResults, STORE_EVENT } from './utils/adminStore';
import { getSellerOf } from './utils/chat';
import BackButton from './components/BackButton';

// Kelipatan default bila barang belum punya pengaturan kelipatan dari admin
const DEFAULT_INCREMENT = 15000;

function maskName(name) {
  const s = String(name || '?').trim();
  if (s.length <= 2) return `${s[0] || '?'}***`;
  return `${s[0]}***${s[s.length - 1]}`;
}

function fmtBidTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return time;
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${time}`;
}

const HalamanDetailLelang = ({ product, onBack, onGoBack, onNavigate, currentUser, onLogout }) => {
  const parsedPrice = Number(String(product?.priceText || '').replace(/\D/g, ''));

  const item = {
    id: product?.id,
    title: product?.title || 'Barang lelang',
    category: 'Lelang',
    startPrice: Number(product?.startPrice || product?.price) || parsedPrice || 0,
    increment: Number(product?.increment) || DEFAULT_INCREMENT,
    endsAt: product?.endsAt || null,
    location: product?.location || '',
    description: product?.description || '',
    seller: product?.seller || getSellerOf(product).name,
    images: (product?.images?.length ? product.images : [product?.image]).filter(Boolean),
  };

  // ── Baca data tawaran dari penyimpanan & render ulang saat berubah ──
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener(STORE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener(STORE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(interval);
    };
  }, [refresh]);

  const bids = auctionBids
    .all()
    .filter((b) => String(b.itemId) === String(item.id))
    .sort((a, b) => b.amount - a.amount || new Date(a.createdAt) - new Date(b.createdAt));
  const result = auctionResults.all().find((r) => String(r.itemId) === String(item.id)) || null;

  const hasBids = bids.length > 0;
  const currentHighestBid = hasBids ? bids[0].amount : item.startPrice;
  const totalBids = bids.length;
  const minRequired = hasBids ? currentHighestBid + item.increment : item.startPrice;
  const iAmTop = hasBids && currentUser && bids[0].bidderId === currentUser.username;
  const bidHistory = [...bids]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((b) => {
      const isMe = currentUser && b.bidderId === currentUser.username;
      return {
        id: b.id,
        user: isMe ? 'Kamu' : maskName(b.bidderName),
        initial: String(b.bidderName || '?').charAt(0).toUpperCase(),
        amount: b.amount,
        time: fmtBidTime(b.createdAt),
        isMe,
      };
    });

  // ── Countdown (hanya jika barang punya waktu berakhir) ──
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!item.endsAt) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [item.endsAt]);
  const msLeft = item.endsAt ? Math.max(0, new Date(item.endsAt).getTime() - nowMs) : null;
  const timeLeft = {
    days: msLeft !== null ? Math.floor(msLeft / 86400000) : 0,
    hours: msLeft !== null ? Math.floor((msLeft % 86400000) / 3600000) : 0,
    minutes: msLeft !== null ? Math.floor((msLeft % 3600000) / 60000) : 0,
  };
  const ended = !!result || msLeft === 0;
  const iWon = result?.winnerId && currentUser && result.winnerId === currentUser.username;

  const [bidInput, setBidInput] = useState('');
  const [bidError, setBidError] = useState('');
  const [lastBidAmount, setLastBidAmount] = useState(0);
  const [activeImage, setActiveImage] = useState(item.images[0]);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [showBidSuccessModal, setShowBidSuccessModal] = useState(false);

  // Handle pengajuan penawaran baru
  const handleAjukanPenawaran = (e) => {
    e.preventDefault();
    setBidError('');

    if (ended) {
      setBidError('Lelang ini sudah berakhir.');
      return;
    }
    if (!currentUser) {
      setBidError('Silakan masuk terlebih dahulu untuk mengajukan penawaran.');
      return;
    }
    const inputVal = Number(String(bidInput).replace(/\D/g, ''));
    if (!inputVal || inputVal < minRequired) {
      setBidError(`Penawaran minimal adalah ${formatRupiah(minRequired)}.`);
      return;
    }

    // Catat penawaran agar muncul di Panel Admin → Tentukan Pemenang
    auctionBids.add({
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images[0] || '',
      sellerName: item.seller,
      bidderId: currentUser.username,
      bidderName: currentUser.fullName || currentUser.username,
      amount: inputVal,
    });

    setLastBidAmount(inputVal);
    setBidInput('');
    setShowBidSuccessModal(true);
  };

  // Format currency rupiah
  function formatRupiah(val) {
    return `Rp${Number(val || 0).toLocaleString('id-ID')}`;
  }

  // Navigasi "Ambil Harga Saat Ini" menuju proses Checkout Escrow
  const handleProceedBuyNow = () => {
    setShowBuyNowModal(false);
    if (onNavigate) {
      onNavigate("checkout", {
        product: {
          ...product,
          ...item,
          image: item.images[0],
          priceText: formatRupiah(currentHighestBid),
          price: currentHighestBid,
          isInstantAuctionBuy: true
        }
      });
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <p className="text-lg font-bold text-[#1F2A24]">Barang lelang tidak ditemukan.</p>
        <button
          onClick={onBack || (() => onNavigate && onNavigate("home"))}
          className="px-5 py-2.5 rounded-xl bg-[#2F7D5B] text-white font-bold text-sm"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1F2A24] antialiased">
      {/* ================= TOP NAVBAR (SESUAI FIGMA) ================= */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          
          {/* Tombol Kembali & Logo */}
          <div className="flex items-center gap-3">
            <BackButton onClick={onGoBack} />
            <button 
              onClick={() => onNavigate && onNavigate("home")}
              className="flex items-center gap-2.5 text-gray-800 hover:opacity-80 transition-opacity"
              title="Ke beranda"
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
              onClick={() => onNavigate && onNavigate("chat", { product: { ...product, category: "Lelang" } })}
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
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "P"}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-800">
                {currentUser?.fullName || "Profil"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* ================= KONTEN UTAMA DUA KOLOM ================= */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8">
        
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

            {/* Thumbnail Foto (hanya jika lebih dari satu foto) */}
            {item.images.length > 1 && <div className="flex gap-3">
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
            </div>}

            {/* Deskripsi Barang */}
            <div className="pt-2 text-[#4A5568] text-sm sm:text-base leading-relaxed space-y-1">
              {item.description && <p>{item.description}</p>}
              <p className="text-sm text-gray-500">
                Penjual: <span className="font-semibold text-gray-700">{item.seller}</span>
                {item.location && <> · {item.location}</>}
              </p>
            </div>
          </div>

          {/* ================= KOLOM KANAN: KONTROL LELANG ================= */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Judul Produk */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {item.title}
            </h1>

            {/* CARD 1: TAWARAN TERTINGGI SAAT INI */}
            <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-[22px] p-6 sm:p-7 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-[#854D0E] mb-1">
                {hasBids ? (ended ? "Tawaran tertinggi akhir" : "Tawaran tertinggi saat ini") : "Harga awal"}
              </p>

              <div className="text-3xl sm:text-[38px] font-black text-[#713F12] tracking-tight mb-1">
                {formatRupiah(currentHighestBid)}
              </div>

              <p className="text-xs sm:text-sm text-[#854D0E] opacity-90 mb-6">
                Harga awal {formatRupiah(item.startPrice)} · {totalBids > 0 ? `${totalBids} penawaran` : "belum ada penawaran"}
                {iAmTop && !ended && <span className="font-bold"> · Kamu penawar tertinggi</span>}
              </p>

              {result ? (
                <div className="bg-white rounded-xl px-4 py-3 text-center border border-[#FEF08A]">
                  {result.status === "Pemenang Ditetapkan" ? (
                    <>
                      <p className="text-sm font-bold text-[#1F2937]">
                        {iWon ? "🎉 Selamat, kamu memenangkan lelang ini!" : "Lelang telah berakhir"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Pemenang: {iWon ? "Kamu" : maskName(result.winnerName)} · {formatRupiah(result.amount)}
                      </p>
                      {iWon && (
                        <p className="text-xs text-[#2F7D5B] font-semibold mt-1">
                          Silakan hubungi penjual untuk menyelesaikan pembayaran.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-bold text-[#1F2937]">Lelang ditutup tanpa pemenang</p>
                  )}
                </div>
              ) : item.endsAt ? (
                ended ? (
                  <div className="bg-white rounded-xl px-4 py-3 text-center border border-[#FEF08A]">
                    <p className="text-sm font-bold text-[#1F2937]">Waktu lelang telah habis</p>
                    <p className="text-xs text-gray-500 mt-0.5">Menunggu admin menetapkan pemenang.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {[
                      [timeLeft.days, "Hari"],
                      [timeLeft.hours, "Jam"],
                      [timeLeft.minutes, "Menit"],
                    ].map(([val, label], idx) => (
                      <React.Fragment key={label}>
                        {idx > 0 && <div className="text-xl font-bold text-[#854D0E]">:</div>}
                        <div className="bg-white rounded-xl px-5 py-3 text-center min-w-[72px] shadow-xs border border-[#FEF08A]">
                          <div className="text-xl sm:text-2xl font-bold text-[#1F2937]">{String(val).padStart(2, '0')}</div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-white rounded-xl px-4 py-3 text-center border border-[#FEF08A]">
                  <p className="text-sm font-semibold text-[#1F2937]">Lelang sedang berlangsung</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pemenang ditetapkan oleh admin TradeMe.</p>
                </div>
              )}
            </div>

            {/* CARD 2: FORM AJUKAN PENAWARAN */}
            {!ended && (
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
                      type="text"
                      inputMode="numeric"
                      value={bidInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setBidInput(raw ? Number(raw).toLocaleString('id-ID') : '');
                        setBidError('');
                      }}
                      className="w-full font-bold text-base text-[#1F2937] outline-none bg-transparent"
                      placeholder={Number(minRequired).toLocaleString('id-ID')}
                    />
                  </div>

                  {bidError ? (
                    <p className="text-xs text-red-600 font-semibold pl-1 pb-2">{bidError}</p>
                  ) : (
                    <p className="text-xs text-gray-400 pl-1 pb-2">
                      Minimal penawaran {formatRupiah(minRequired)}
                      {hasBids && ` (kelipatan ${formatRupiah(item.increment)})`}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#F1B33B] hover:bg-[#E5A42A] active:scale-[0.99] text-[#1F2A24] font-bold text-sm sm:text-base rounded-xl transition-all shadow-xs"
                  >
                    {currentUser ? "Ajukan Penawaran" : "Masuk untuk Menawar"}
                  </button>
                </form>
              </div>
            )}

            {/* CARD 3: RIWAYAT PENAWARAN */}
            <div className="bg-white rounded-[22px] border border-gray-200 p-6 sm:p-7 shadow-xs">
              <h3 className="font-bold text-base text-[#111827] mb-4">
                Riwayat penawaran
              </h3>

              {bidHistory.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Belum ada penawaran. Jadilah penawar pertama!
                </p>
              )}

              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {bidHistory.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${bid.isMe ? "bg-[#2F7D5B] text-white" : "bg-[#E8F5E9] text-[#2F7D5B]"}`}>
                        {bid.initial}
                      </div>
                      <span className={`text-sm text-gray-800 ${bid.isMe ? "font-bold" : "font-medium"}`}>
                        {bid.user}
                      </span>
                    </div>
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

            {/* AMBIL HARGA SAAT INI & CHAT PENJUAL */}
            <div className="pt-2 space-y-3">
              {!ended && (
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
              )}

              {/* Tombol Chat Penjual Sesuai Figma */}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("chat", { product: { ...product, category: "Lelang" } })}
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
              Anda kini menjadi penawar tertinggi dengan nilai <strong>{formatRupiah(lastBidAmount)}</strong>.
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
