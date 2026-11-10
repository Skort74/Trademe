import React from "react";

export default function HalamanSuksesPembayaran({ product, onBack, onNavigate, onLogout }) {
  const item = product || {
    title: "Sepeda Kota Vintage",
    priceText: "Rp750.000",
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
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-[760px] bg-white rounded-[28px] border border-[#EAEFEA] shadow-[0_16px_40px_-12px_rgba(47,125,91,0.08)] p-6 sm:p-12 md:p-16 text-center animate-fadeIn">
          {/* Top Shield Success Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#EAF5EF] text-[#2F7D5B] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-[38px] font-bold text-[#1F2A24] tracking-tight mb-3">
            Pembayaran berhasil
          </h1>

          {/* Subtitle */}
          <p className="text-[#66736C] text-sm sm:text-[15px] leading-relaxed max-w-lg mx-auto mb-10">
            Dana <span className="font-bold text-[#1F2A24]">{item.priceText || "Rp750.000"}</span> telah diamankan. Selesaikan serah terima barang untuk melanjutkan transaksi.
          </p>

          {/* Stepper Progress Bar */}
          <div className="w-full max-w-xl mx-auto mb-12 px-2 sm:px-6">
            <div className="relative flex items-center justify-between">
              {/* Connecting Line */}
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#D5E5DC] z-0"></div>

              {/* Step 1: Dibuat (Done) */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white">
                  ✓
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#2F7D5B] mt-2">
                  Dibuat
                </span>
              </div>

              {/* Step 2: Dibayar (Done) */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white">
                  ✓
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#2F7D5B] mt-2">
                  Dibayar
                </span>
              </div>

              {/* Step 3: COD (Next) */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5EAE7] text-[#718096] flex items-center justify-center font-bold text-xs ring-4 ring-white">
                  3
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#718096] mt-2">
                  COD
                </span>
              </div>

              {/* Step 4: Diterima */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5EAE7] text-[#718096] flex items-center justify-center font-bold text-xs ring-4 ring-white">
                  4
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#718096] mt-2">
                  Diterima
                </span>
              </div>

              {/* Step 5: Selesai */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5EAE7] text-[#718096] flex items-center justify-center font-bold text-xs ring-4 ring-white">
                  5
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#718096] mt-2">
                  Selesai
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("home")}
              className="py-3.5 px-8 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md shadow-[#2F7D5B]/25 hover:shadow-lg transition-all cursor-pointer"
            >
              Lihat Riwayat Transaksi
            </button>
            <button
              type="button"
              onClick={onBack}
              className="py-3.5 px-6 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 text-[#516057] font-semibold text-sm transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
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

