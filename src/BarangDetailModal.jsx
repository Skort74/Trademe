import React, { useEffect } from "react";

function initials(name) {
  return String(name || "Barang")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return value || "";
  return `Rp${value.toLocaleString("id-ID")}`;
}

export default function BarangDetailModal({
  item,
  onClose,
  onEdit,
  onDelete,
  eyebrow = "DETAIL BARANG",
  children,
}) {
  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const name = item.barang || item.name || "Barang";
  const type = item.jenis || item.type;
  const status = item.kurasi || item.status;
  const owner = item.pemilik || item.owner;
  const condition = item.kondisi || item.condition;
  const description = item.deskripsi || item.description;
  const location = item.lokasi || item.location;
  const recipient = item.penerima || item.recipient;
  const price = item.harga ?? item.price;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14231B]/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#DCE6DF] bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-[#E8EDE9] bg-[#F8FAF9] px-5 py-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2F7D5B]">{eyebrow}</p>
            <h2 id="item-detail-title" className="mt-1 text-lg font-bold text-[#1F2A24]">{name}</h2>
          </div>
          <button
            type="button"
            aria-label="Tutup detail"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9EFEB] text-sm font-bold text-[#56635B] transition-colors hover:bg-[#DCE6DF]"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border border-[#E8EDE9] bg-gradient-to-br from-[#E8F5E9] to-[#D2E7DA]">
            <span className="text-3xl font-extrabold text-[#2F7D5B]">{initials(name)}</span>
            {item.image && (
              <img
                src={item.image}
                alt={name}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {type && <span className="rounded-full bg-[#E5F2EB] px-3 py-1 text-[11px] font-bold text-[#1F6044]">{type}</span>}
            {status && <span className="rounded-full bg-[#F1F4F2] px-3 py-1 text-[11px] font-bold text-[#56635B]">{status}</span>}
            {condition && <span className="rounded-full bg-[#FFF6DF] px-3 py-1 text-[11px] font-bold text-[#8A641A]">{condition}</span>}
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[#E8EDE9] bg-[#F8FAF9] p-4 text-xs sm:grid-cols-2">
            {owner && <div><dt className="text-[#7A8780]">Pemilik</dt><dd className="mt-0.5 font-bold text-[#1F2A24]">{owner}</dd></div>}
            {location && <div><dt className="text-[#7A8780]">Lokasi</dt><dd className="mt-0.5 font-bold text-[#1F2A24]">{location}</dd></div>}
            {recipient && <div><dt className="text-[#7A8780]">Penerima</dt><dd className="mt-0.5 font-bold text-[#1F2A24]">{recipient}</dd></div>}
            {price !== null && price !== undefined && price !== "" && (
              <div><dt className="text-[#7A8780]">Harga/Preferensi</dt><dd className="mt-0.5 font-bold text-[#1F2A24]">{formatPrice(price)}</dd></div>
            )}
          </dl>

          {description && (
            <div className="mt-4">
              <p className="mb-1 text-[11px] font-bold text-[#56635B]">Deskripsi</p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#1F2A24]">{description}</p>
            </div>
          )}

          {children}
        </div>

        {(onEdit || onDelete) && (
          <footer className="flex justify-end gap-2 border-t border-[#E8EDE9] bg-white px-5 py-4">
            {onDelete && (
              <button type="button" onClick={onDelete} className="rounded-xl border border-[#F3C7CC] px-4 py-2 text-xs font-bold text-[#C24150] hover:bg-[#FFF3F5]">
                Hapus
              </button>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit} className="rounded-xl bg-[#2F7D5B] px-4 py-2 text-xs font-bold text-white hover:bg-[#25664A]">
                Edit Data
              </button>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
