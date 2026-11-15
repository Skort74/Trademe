// Komponen UI bersama untuk tab-tab Panel Admin (mengikuti gaya tab Barang)
import React, { useEffect, useState, useCallback } from "react";
import { STORE_EVENT } from "../utils/adminStore";

// ─── Helpers ────────────────────────────────────────────────────────────────
export function fmtRp(num) {
  return "Rp" + Number(num || 0).toLocaleString("id-ID");
}

export function fmtDate(iso, withTime = true) {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

export function initials(name) {
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

export function matches(q, ...fields) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return fields.some((f) => String(f || "").toLowerCase().includes(s));
}

/**
 * Baca data dari localStorage dan render ulang saat data berubah
 * (perubahan dari tab ini, tab browser lain, atau polling ringan).
 */
export function useStoreData(read) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener(STORE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener(STORE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(interval);
    };
  }, [refresh]);
  return [read(), refresh];
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }) {
  return (
    <section className={`bg-white border border-[#DCE6DF] rounded-[15px] p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-4">
      <div>
        <h2 className="text-[#1F2A24] text-[15px] font-bold">{title}</h2>
        {subtitle && <p className="text-[#66736C] text-[11px] mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function TwoColumn({ list, detail }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start pb-6">
      <div className="min-w-0">{list}</div>
      <div className="xl:sticky xl:top-6">{detail}</div>
    </div>
  );
}

// ─── Inputs ─────────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Cari ..." }) {
  return (
    <div className="relative flex items-center">
      <svg className="w-3.5 h-3.5 absolute left-3 text-[#8A948E] pointer-events-none" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-[170px] lg:w-[190px] h-[38px] pl-9 pr-3 rounded-[10px] border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] placeholder-[rgba(31,42,36,0.50)] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B] transition-all"
      />
    </div>
  );
}

export function SelectFilter({ value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] pl-3 pr-7 rounded-[9px] border border-[#DCE6DF] bg-white text-xs text-[#66736C] appearance-none focus:outline-none focus:border-[#2F7D5B] cursor-pointer"
      >
        <option value="Semua">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <svg className="w-2.5 h-2 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66736C] pointer-events-none" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export const inputCls =
  "w-full h-10 px-3 rounded-xl border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B]";
export const textareaCls =
  "w-full p-2.5 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B] resize-none";

export function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-[#1F2A24] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

// ─── Buttons & badges ───────────────────────────────────────────────────────
const BTN = {
  primary: "bg-[#2F7D5B] text-white hover:bg-[#25664a] border border-[#2F7D5B]",
  approve: "bg-[#E5F2EB] text-[#1F6044] border border-[#B7D9C6] hover:bg-[#d5eadf]",
  danger: "bg-[#FAE8E8] text-[#A83F49] border border-[#EFC8CB] hover:bg-[#f6dbdb]",
  outline: "bg-white text-[#1F2A24] border border-[#DCE6DF] hover:bg-[#F8FAF9]",
  link: "bg-white text-[#2F7D5B] border border-[#DCE6DF] hover:bg-[#E5F2EB]",
};

export function Button({ variant = "outline", size = "md", className = "", ...props }) {
  const sz = size === "sm" ? "px-2.5 py-1 text-[9px] rounded-md" : "h-[36px] px-3.5 text-[11px] rounded-lg";
  return (
    <button
      type="button"
      {...props}
      className={`${sz} ${BTN[variant]} font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
}

const BADGE_COLORS = {
  green: "bg-[#D1FAE5] text-[#065F46]",
  soft: "bg-[#E5F2EB] text-[#1F6044]",
  red: "bg-[#FEE2E2] text-[#991B1B]",
  amber: "bg-[#FEF3C7] text-[#92400E]",
  blue: "bg-[#DBEAFE] text-[#1E40AF]",
  purple: "bg-[#EDE9FE] text-[#5B21B6]",
  gray: "bg-[#F1F5F9] text-[#475569]",
};

const STATUS_COLOR = {
  Aktif: "green",
  Nonaktif: "gray",
  Disetujui: "green",
  Selesai: "green",
  "Pemenang Ditetapkan": "green",
  Dibayar: "blue",
  Dikirim: "purple",
  Ditinjau: "blue",
  Menunggu: "amber",
  "Menunggu Pembayaran": "amber",
  "Menunggu Verifikasi": "amber",
  Terbuka: "amber",
  Berlangsung: "blue",
  Ditolak: "red",
  Dibatalkan: "red",
  "Dana Dikembalikan": "red",
  "Ditutup Tanpa Pemenang": "gray",
  admin: "purple",
  user: "soft",
};

export function Badge({ children, color }) {
  const c = BADGE_COLORS[color || STATUS_COLOR[children] || "soft"];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${c}`}>
      {children}
    </span>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────────
export function Table({ columns, children, empty, colSpan }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F7FAF8] border-b border-[#E8EDE9]">
            {columns.map((c) => (
              <th key={c.label || c} className={`py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase whitespace-nowrap ${c.className || ""}`}>
                {c.label ?? c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows}
          {rows.length === 0 && (
            <tr>
              <td colSpan={colSpan || columns.length} className="py-10 text-center text-xs text-gray-400">
                {empty || "Belum ada data."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Row({ selected, onClick, children }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#E8EDE9] transition-colors ${onClick ? "cursor-pointer" : ""} ${
        selected ? "bg-[#F1F7F3]" : "bg-white hover:bg-[#F8FAF9]"
      }`}
    >
      {children}
    </tr>
  );
}

export function Cell({ children, bold, className = "" }) {
  return (
    <td className={`py-3 px-4 text-[#1F2A24] text-[11px] ${bold ? "font-bold" : ""} ${className}`}>{children}</td>
  );
}

// ─── Detail panel ───────────────────────────────────────────────────────────
export function DetailPanel({ label, children, emptyText = "Pilih data di tabel untuk melihat detail." }) {
  return (
    <div className="bg-white border border-[#DCE6DF] rounded-[15px] p-5 shadow-[0_9px_28px_0_rgba(31,74,51,0.06)]">
      <p className="text-[#2F7D5B] text-[9px] font-extrabold tracking-[0.137em] uppercase mb-2">{label}</p>
      {children || <p className="text-xs text-[#66736C] py-8 text-center">{emptyText}</p>}
    </div>
  );
}

export function InfoList({ rows }) {
  return (
    <dl className="divide-y divide-[#EEF2EF] border border-[#E8EDE9] rounded-xl my-3">
      {rows.filter(Boolean).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 px-3 py-2">
          <dt className="text-[10px] text-[#66736C] shrink-0">{k}</dt>
          <dd className="text-[11px] text-[#1F2A24] font-semibold text-right break-words min-w-0">{v ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────────────
export function Modal({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-[#DCE6DF] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8EDE9] flex items-center justify-between bg-[#F8FAF9]">
          <div>
            <h3 className="text-base font-bold text-[#1F2A24]">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#66736C]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#E8EDE9] flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = "Ya, Lanjutkan", danger, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#DCE6DF] shadow-2xl w-full max-w-sm p-6 text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold ${danger ? "bg-red-100 text-red-600" : "bg-[#E5F2EB] text-[#2F7D5B]"}`}>
          {danger ? "✕" : "?"}
        </div>
        <h4 className="text-base font-bold text-[#1F2A24] mb-1">{title}</h4>
        <p className="text-xs text-[#66736C] mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-2.5">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer">
            Batal
          </button>
          <button type="button" onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${danger ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#2F7D5B] hover:bg-[#25664a]"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-[#DCE6DF] rounded-[15px] p-4 shadow-sm hover:border-[#2F7D5B]/50 transition-colors cursor-pointer"
    >
      <p className="text-[#66736C] text-[10px] font-bold uppercase tracking-[0.1em]">{label}</p>
      <p className="text-[#1F2A24] text-[24px] font-extrabold mt-1 leading-tight">{value}</p>
      {hint && <p className="text-[#2F7D5B] text-[10px] font-semibold mt-1">{hint}</p>}
    </button>
  );
}
