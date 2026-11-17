import React, { useState } from "react";
import GoogleMap from "./GoogleMap";

/**
 * Pilih lokasi dengan Google Maps:
 * ketik nama tempat / alamat → "Cari" untuk melihat di peta → "Gunakan Lokasi Ini".
 * Bisa juga memakai lokasi GPS perangkat ("Lokasi saya").
 *
 * value / onChange: { label, query } | null
 */
export default function LocationPicker({
  value,
  onChange,
  placeholder = "Contoh: Taman Bungkul, Surabaya",
  defaultQuery = "Surabaya, Jawa Timur",
  mapHeight = 240,
}) {
  const [input, setInput] = useState(value?.label || "");
  const [previewQuery, setPreviewQuery] = useState(value?.query || "");
  const [previewLabel, setPreviewLabel] = useState(value?.label || "");
  const [geoStatus, setGeoStatus] = useState(""); // "", "loading", pesan error
  const [error, setError] = useState("");

  const search = () => {
    const q = input.trim();
    if (!q) {
      setError("Ketik nama tempat atau alamat terlebih dahulu.");
      return;
    }
    setError("");
    setPreviewQuery(q);
    setPreviewLabel(q);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Browser tidak mendukung lokasi otomatis.");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const q = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        const label = `Lokasi GPS (${q})`;
        setPreviewQuery(q);
        setPreviewLabel(label);
        setInput("");
        setGeoStatus("");
        onChange && onChange({ label, query: q });
      },
      () => setGeoStatus("Izin lokasi ditolak atau lokasi tidak ditemukan."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const confirm = () => {
    if (!previewQuery) return;
    onChange && onChange({ label: previewLabel || previewQuery, query: previewQuery });
  };

  // Tombol konfirmasi muncul bila lokasi di peta belum dipakai
  const showConfirm = !!previewQuery && previewQuery !== value?.query;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-[44px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/20"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={search}
            className="h-[44px] px-4 rounded-[10px] border border-[#DCE6DF] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2A24]"
          >
            Cari
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoStatus === "loading"}
            className="h-[44px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-white hover:bg-gray-50 text-xs font-bold text-[#2F7D5B] whitespace-nowrap disabled:opacity-60"
          >
            {geoStatus === "loading" ? "Mencari…" : "📍 Lokasi saya"}
          </button>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-600 font-semibold mb-2">{error}</p>}
      {geoStatus && geoStatus !== "loading" && (
        <p className="text-[11px] text-red-600 font-semibold mb-2">{geoStatus}</p>
      )}

      <GoogleMap query={previewQuery || value?.query || defaultQuery} height={mapHeight} title="Pilih lokasi" />

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {value?.query ? (
          <p className="text-[11px] font-semibold text-[#2F7D5B]">
            ✅ Lokasi dipilih: <span className="text-[#1F2A24]">{value.label}</span>
          </p>
        ) : (
          <p className="text-[11px] text-[#718096]">Cari lokasi, periksa di peta, lalu tekan “Gunakan Lokasi Ini”.</p>
        )}
        {showConfirm && (
          <button
            type="button"
            onClick={confirm}
            className="px-4 py-2 rounded-lg bg-[#2F7D5B] hover:bg-[#25664a] text-white text-[11px] font-bold shrink-0"
          >
            Gunakan Lokasi Ini
          </button>
        )}
      </div>
    </div>
  );
}
