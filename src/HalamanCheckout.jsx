import React, { useState } from "react";

export default function HalamanCheckout({ product, onBack, onNavigate, onLogout }) {
  const item = product || {
    title: "Sepeda Kota Vintage",
    category: "Jual",
    priceText: "Rp750.000",
    image: "/images/vintage-bike.jpg",
    location: "Wonokromo",
  };

  const [deliveryMethod, setDeliveryMethod] = useState("COD"); // "COD" | "Delivery"
  const [meetingTime, setMeetingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank BCA");
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute pricing
  const rawPrice = 750000;
  const serviceFee = 5000;
  const totalPrice = rawPrice + serviceFee;

  const handlePayNow = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (onNavigate) {
        onNavigate("payment_success", { product: item });
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-plusJakartaSans text-[#1F2A24] flex flex-col justify-between">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
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

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1">
        {/* Breadcrumb / Eyebrow */}
        <p className="text-[#2F7D5B] text-[11px] font-extrabold leading-[16.5px] tracking-[0.1636em] uppercase mb-2">
          Langkah Terakhir
        </p>

        {/* Heading */}
        <h1 className="text-3xl sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-7">
          Pembayaran & serah terima
        </h1>

        {/* 1. Item Summary Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex items-center justify-between gap-4 mb-6 shadow-xs">
          <div className="flex items-center gap-3.5">
            <img
              src={item.image || "/images/vintage-bike.jpg"}
              alt={item.title}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-gray-100"
            />
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EF] text-[#2F7D5B] inline-block mb-1">
                {item.category || "Jual"}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#1F2A24] line-clamp-1">
                {item.title}
              </h2>
              <p className="text-xs text-[#718096] mt-0.5">
                Dijual oleh Budi Santoso
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-bold text-[#1F2A24]">
              {item.priceText || "Rp750.000"}
            </span>
          </div>
        </div>

        {/* 2. Metode Serah Terima Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 mb-6 shadow-xs">
          <h2 className="text-base font-bold text-[#1F2A24] mb-3.5">
            Metode serah terima
          </h2>

          {/* Delivery Method Options */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* COD Tab */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("COD")}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all ${
                deliveryMethod === "COD"
                  ? "border-2 border-[#2F7D5B] bg-[#F9FCFA] shadow-xs"
                  : "border border-[#DCE6DF] bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-sm text-[#1F2A24]">COD</div>
              <div className="text-xs text-[#718096] mt-0.5">Cek barang langsung</div>
            </button>

            {/* Delivery Tab */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("Delivery")}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all ${
                deliveryMethod === "Delivery"
                  ? "border-2 border-[#2F7D5B] bg-[#F9FCFA] shadow-xs"
                  : "border border-[#DCE6DF] bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-sm text-[#1F2A24]">Delivery</div>
              <div className="text-xs text-[#718096] mt-0.5">Dikirim ke alamatmu</div>
            </button>
          </div>

          {/* Map Preview for Meeting Point */}
          <div className="relative w-full h-44 sm:h-48 rounded-2xl bg-[#E8F1EC] border border-[#D5E5DC] overflow-hidden flex items-center justify-center shadow-inner mb-5">
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="0" y1="35%" x2="100%" y2="65%" stroke="#C7DDD1" strokeWidth="8" />
              <line x1="0" y1="80%" x2="100%" y2="25%" stroke="#C7DDD1" strokeWidth="6" />
              <line x1="25%" y1="0" x2="75%" y2="100%" stroke="#D3E5DC" strokeWidth="4" />
              <circle cx="50%" cy="50%" r="50" fill="none" stroke="#BFD7C9" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center shadow-lg shadow-[#2F7D5B]/35 ring-4 ring-white/80">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div className="absolute bottom-3.5 left-3.5 bg-white/95 backdrop-blur-sm rounded-xl px-3.5 py-2 shadow-md border border-gray-100 z-20">
              <span className="text-[11px] font-bold text-[#1F2A24] block leading-tight">
                Tentukan titik temu
              </span>
              <span className="text-[10px] text-[#718096] block">
                {item.location || "Wonokromo"}, Surabaya
              </span>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
                Tanggal & waktu pertemuan
              </label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="Pilih tanggal dan jam..."
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
                Catatan untuk penjual
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Saya memakai jaket hijau"
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
              />
            </div>
          </div>
        </div>

        {/* 3. Ringkasan Pembayaran Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 mb-8 shadow-xs">
          <h2 className="text-base font-bold text-[#1F2A24] mb-4">
            Ringkasan pembayaran
          </h2>

          <div className="space-y-2.5 text-xs sm:text-[13px] text-[#516057] pb-3 border-b border-gray-100">
            <div className="flex justify-between">
              <span>Harga barang</span>
              <span className="font-medium text-[#1F2A24]">Rp750.000</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya layanan</span>
              <span className="font-medium text-[#1F2A24]">Rp5.000</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 text-sm sm:text-base font-bold text-[#1F2A24]">
            <span>Total</span>
            <span className="text-lg font-extrabold text-[#1F2A24]">
              Rp{totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-4 mb-5">
            <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
              Metode pembayaran
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-[46px] px-3.5 pr-10 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] font-medium appearance-none focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20 cursor-pointer"
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                <option value="QRIS">QRIS (Gopay / OVO / ShopeePay)</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Escrow Trust Notice */}
          <div className="w-full rounded-xl p-3.5 bg-[#EBF5EF] border border-[#D2E7DA] flex items-center gap-2.5 text-xs text-[#2F7D5B] mb-5">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <span className="font-bold block text-[#1F2A24]">Dana ditahan dengan aman</span>
              <span className="text-[11px] text-[#516057]">Penjual menerima dana setelah barang kamu konfirmasi diterima.</span>
            </div>
          </div>

          {/* Bayar Sekarang Button */}
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full py-4 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-[#2F7D5B]/25 hover:shadow-lg transition-all text-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Bayar Sekarang</span>
            )}
          </button>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E8EEEA] bg-white pt-8 pb-10">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
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
        </div>
      </footer>
    </div>
  );
}

