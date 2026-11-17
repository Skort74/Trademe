import React from "react";

/** URL halaman Google Maps (untuk dibuka di tab baru / aplikasi Maps) */
export function googleMapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "Surabaya")}`;
}

/**
 * Peta Google Maps asli (embed resmi, tanpa API key).
 * `query` bisa berupa alamat / nama tempat, atau koordinat "lat,lng".
 */
export default function GoogleMap({
  query,
  zoom = 15,
  height = 220,
  title = "Peta lokasi",
  showLink = true,
  className = "",
}) {
  const q = String(query || "").trim() || "Surabaya, Jawa Timur";
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&hl=id&output=embed`;

  return (
    <div className={className}>
      <div
        className="w-full rounded-2xl overflow-hidden border border-[#D5E5DC] bg-[#E8F1EC]"
        style={{ height }}
      >
        <iframe
          key={src}
          title={title}
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {showLink && (
        <a
          href={googleMapsLink(q)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[#2F7D5B] hover:underline"
        >
          Buka di Google Maps ↗
        </a>
      )}
    </div>
  );
}
