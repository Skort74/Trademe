import React, { useEffect } from "react";

export default function PopupSuksesUnggah({ itemName, itemType, onHome, onHistory }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onHome?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onHome]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14231B]/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-success-title"
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-2xl sm:p-8"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F5E9]">
          <svg className="h-10 w-10 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 id="upload-success-title" className="mb-2 text-2xl font-extrabold text-[#1F2A24]">
          Barang Berhasil Diterbitkan!
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-[#718096]">
          Unggahanmu sudah tersimpan dan akan diperiksa oleh tim TradeMe sebelum ditampilkan kepada pengguna lain.
        </p>

        <div className="mb-7 rounded-2xl border border-[#E1ECE5] bg-[#F8FAF9] p-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#2F7D5B]">Unggahan baru</p>
          <p className="mt-1 font-bold text-[#1F2A24]">{itemName}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#718096]">
            <span>{itemType}</span>
            <span className="rounded-full bg-[#E2F1E8] px-2.5 py-1 font-semibold text-[#2F7D5B]">Dalam kurasi</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-xl bg-[#2F7D5B] py-3.5 text-sm font-bold text-white shadow-md shadow-[#2F7D5B]/20 transition-colors hover:bg-[#25664A]"
          >
            Kembali ke Beranda
          </button>
          <button
            type="button"
            onClick={onHistory}
            className="w-full rounded-xl border border-[#CFE0D6] bg-white py-3.5 text-sm font-bold text-[#2F7D5B] transition-colors hover:bg-[#F0F7F4]"
          >
            Lihat Riwayat Unggahan
          </button>
        </div>
      </section>
    </div>
  );
}
