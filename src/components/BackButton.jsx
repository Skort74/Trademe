import React from "react";

/**
 * Tombol "Kembali" ke halaman sebelumnya, dipasang di header.
 * Tidak dirender bila tidak ada halaman sebelumnya (onClick kosong).
 */
export default function BackButton({ onClick, label = "Kembali", className = "" }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kembali ke halaman sebelumnya"
      title="Kembali ke halaman sebelumnya"
      className={`inline-flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-full border border-[#DCE6DF] bg-white hover:bg-[#F1F7F3] text-[#1F2A24] text-xs font-bold transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[#2F7D5B]/25 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
