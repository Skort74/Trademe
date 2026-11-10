import React, { useEffect, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "./TradeMeLayout";

const TYPES = [
  { id: "Jual", desc: "Pembeli membayar dengan harga tetap", badge: "bg-trade-100 text-trade-600" },
  { id: "Tukar", desc: "Tukar dengan barang lain", badge: "bg-sky-100 text-sky-700" },
  { id: "Lelang", desc: "Terima penawaran tertinggi", badge: "bg-amber-100 text-amber-700" },
  { id: "Donasi", desc: "Berikan gratis ke yang membutuhkan", badge: "bg-rose-100 text-rose-700" },
];

// Samakan dengan filter di TradeMeHome.jsx
const CATEGORIES = ["Furnitur", "Kendaraan", "Elektronik", "Dekorasi", "Musik", "Peralatan"];
const CONDITIONS = ["Sangat baik", "Baik", "Cukup baik"];
const MAX_PHOTOS = 5;

// Isian harga berubah sesuai jenis transaksi (Donasi tidak punya isian harga)
const PRICE_FIELD = {
  Jual: { label: "Harga jual", placeholder: "Contoh: 100.000", money: true },
  Lelang: { label: "Harga awal lelang", placeholder: "Contoh: 100.000", money: true },
  Tukar: {
    label: "Ingin ditukar dengan",
    placeholder: "Contoh: Sepeda lipat atau kamera",
    money: false,
  },
};

const base =
  "w-full rounded-xl border border-trade-border bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-trade-muted/70 focus:border-trade-500 focus:ring-2 focus:ring-trade-500/20";
const inputCls = `${base} text-trade-dark`;

function StepHeading({ n, title, hint }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-trade-500 text-sm font-bold text-white">
        {n}
      </span>
      <div>
        <h2 className="text-base font-bold leading-tight">{title}</h2>
        <p className="text-xs text-trade-muted">{hint}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required
        className={`${base} appearance-none pr-9 ${value ? "text-trade-dark" : "text-trade-muted"}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-trade-muted"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 1l4 4 4-4" />
      </svg>
    </div>
  );
}

export default function UnggahBarang() {
  const params = new URLSearchParams(window.location.search);
  const penerima = params.get("penerima");
  const [type, setType] = useState(() =>
    TYPES.some((t) => t.id === params.get("jenis")) ? params.get("jenis") : "Jual",
  );
  const [photos, setPhotos] = useState([]); // { id, file, url }
  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "",
    description: "",
    price: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const fileRef = useRef(null);
  const photosRef = useRef([]);
  photosRef.current = photos;

  // Bersihkan URL preview saat halaman ditutup
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const priceField = PRICE_FIELD[type];

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setPrice = (e) => {
    let v = e.target.value;
    if (priceField.money) {
      const digits = v.replace(/\D/g, "");
      v = digits ? Number(digits).toLocaleString("id-ID") : "";
    }
    setForm((f) => ({ ...f, price: v }));
  };

  const chooseType = (id) => {
    setType(id);
    setForm((f) => ({ ...f, price: "" }));
  };

  const addPhotos = (e) => {
    const picked = Array.from(e.target.files).filter((f) => /^image\/(jpe?g|png)$/.test(f.type));
    const room = MAX_PHOTOS - photos.length;
    const added = picked.slice(0, room).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...added]);
    setError("");
    e.target.value = "";
  };

  const removePhoto = (id) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Tambahkan minimal 1 foto barang.");
      return;
    }
    const payload = { type, ...form, photos: photos.map((p) => p.file) };
    // TODO: kirim ke backend setelah endpoint API siap
    console.log("Data barang:", payload);
    setDone(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-trade-bg font-sans text-trade-dark">
      {/* Header */}
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">
        <p className="text-[11px] font-bold tracking-[0.14em] text-trade-500">
          BERIKAN KESEMPATAN KEDUA
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Unggah barang</h1>
        <p className="mt-1.5 text-sm text-trade-muted">
          Lengkapi informasi agar barangmu mudah ditemukan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          {/* Langkah 1 */}
          <StepHeading n="1" title="Pilih jenis transaksi" hint="Apa yang ingin kamu lakukan?" />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseType(t.id)}
                  aria-pressed={active}
                  className={`rounded-xl border bg-white p-3.5 text-left transition ${
                    active
                      ? "border-trade-500 ring-1 ring-trade-500"
                      : "border-trade-border hover:border-trade-200"
                  }`}
                >
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.badge}`}
                  >
                    {t.id}
                  </span>
                  <span className="mt-2 block text-sm font-bold">{t.id}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-trade-muted">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <hr className="my-8 border-trade-border" />

          {/* Langkah 2 */}
          <StepHeading
            n="2"
            title="Isi detail barang"
            hint="Berikan informasi yang jelas dan jujur."
          />
          {type === "Donasi" && penerima && (
            <p className="mt-3 rounded-xl bg-trade-100 px-4 py-2.5 text-xs font-medium text-trade-700">
              Donasi untuk: {penerima}
            </p>
          )}

          <div className="mt-4 grid gap-5 md:grid-cols-5">
            <div className="flex flex-col md:col-span-2">
              <div className="flex min-h-[18rem] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-trade-200 bg-trade-50 p-6 text-center">
                <svg
                  className="mx-auto text-trade-500"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p className="mt-2 text-sm font-bold text-trade-500">Tambahkan foto barang</p>
                <p className="mt-0.5 text-[11px] text-trade-muted">
                  Unggah hingga {MAX_PHOTOS} foto. Format JPG/PNG.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={addPhotos}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  disabled={photos.length >= MAX_PHOTOS}
                  className="mt-3 rounded-lg border border-trade-border bg-white px-4 py-1.5 text-xs font-semibold transition hover:bg-trade-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Pilih Foto
                </button>

                {photos.length > 0 && (
                  <div className="mt-4 grid w-full grid-cols-5 gap-2">
                    {photos.map((p) => (
                      <div key={p.id} className="relative aspect-square">
                        <img
                          src={p.url}
                          alt={p.file.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label={`Hapus ${p.file.name}`}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-trade-dark text-[10px] text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
            </div>
            <div className="md:col-span-3">
              <div className="space-y-4">
                <Field label="Nama barang">
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={setField("name")}
                    placeholder="Contoh: Sepeda kota vintage"
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kategori">
                    <Select
                      value={form.category}
                      onChange={setField("category")}
                      placeholder="Pilih kategori"
                      options={CATEGORIES}
                    />
                  </Field>
                  <Field label="Kondisi">
                    <Select
                      value={form.condition}
                      onChange={setField("condition")}
                      placeholder="Pilih kondisi"
                      options={CONDITIONS}
                    />
                  </Field>
                </div>

                <Field label="Deskripsi">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={setField("description")}
                    placeholder="Ceritakan kondisi, ukuran, kekurangan, dan keterangan lainnya."
                    className={`${inputCls} resize-y`}
                  />
                </Field>

                {priceField && (
                  <Field label={priceField.label}>
                    <input
                      type="text"
                      required
                      inputMode={priceField.money ? "numeric" : "text"}
                      value={form.price}
                      onChange={setPrice}
                      placeholder={priceField.placeholder}
                      className={inputCls}
                    />
                  </Field>
                )}

                <Field label="Lokasi barang">
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={setField("location")}
                    placeholder="Kecamatan di Surabaya"
                    className={inputCls}
                  />
                </Field>
              </div>

              {done && (
                <p className="mt-5 rounded-xl bg-trade-100 px-4 py-3 text-sm font-medium text-trade-700">
                  Data barang tercatat (cek console). Belum terhubung ke backend.
                </p>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-trade-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-trade-600 active:bg-trade-700"
              >
                Terbitkan Barang
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
