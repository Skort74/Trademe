
import React, { useEffect, useRef, useState } from "react";

// ==========================================
// DATA JENIS TRANSAKSI
// ==========================================

const TYPES = [
  {
    id: "Jual",
    desc: "Jual barang dengan harga tetap",
  },
  {
    id: "Tukar",
    desc: "Tukar dengan barang lain",
  },
  {
    id: "Lelang",
    desc: "Terima penawaran tertinggi",
  },
  {
    id: "Donasi",
    desc: "Donasikan barang layak pakai",
  },
];

const CATEGORIES = [
  "Furnitur",
  "Kendaraan",
  "Elektronik",
  "Dekorasi",
  "Musik",
  "Peralatan",
];

const CONDITIONS = [
  "Sangat baik",
  "Baik",
  "Cukup baik",
];

const MAX_PHOTOS = 5;

const PRICE_FIELD = {
  Jual: {
    label: "Harga jual",
    placeholder: "Contoh: 100.000",
    money: true,
  },
  Lelang: {
    label: "Harga awal lelang",
    placeholder: "Contoh: 100.000",
    money: true,
  },
  Tukar: {
    label: "Ingin ditukar dengan",
    placeholder: "Contoh: Sepeda lipat atau kamera",
    money: false,
  },
};

// ==========================================
// STYLE INPUT
// ==========================================

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function Field({ label, children }) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-semibold text-gray-900">
        {label}
      </label>
      {children}
    </div>
  );
}

// ==========================================
// HALAMAN UTAMA
// ==========================================

export default function UnggahBarang({
  onNavigate,
  currentUser,
}) {
  const params = new URLSearchParams(
    window.location.search
  );

  const [type, setType] = useState(() => {
    const jenis = params.get("jenis");

    return TYPES.some((t) => t.id === jenis)
      ? jenis
      : "Jual";
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "",
    description: "",
    price: "",
    recipient: params.get("penerima") || "",
    location: "",
  });

  const [photos, setPhotos] = useState([]);
  const [selectedPhotoId, setSelectedPhotoId] =
    useState(null);

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const fileRef = useRef(null);
  const photosRef = useRef([]);

  photosRef.current = photos;

  // Membersihkan URL foto saat komponen ditutup
  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  const priceField = PRICE_FIELD[type];

  const activePhoto =
    photos.find((p) => p.id === selectedPhotoId) ||
    photos[0];

  // ==========================================
  // NAVIGASI
  // ==========================================

  const handleBack = () => {
    if (typeof onNavigate === "function") {
      onNavigate("home");
    } else {
      window.location.assign("/");
    }
  };

  // ==========================================
  // MENGUBAH INPUT
  // ==========================================

  const setField = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

    setDone(false);
  };

  // ==========================================
  // FORMAT HARGA
  // ==========================================

  const setPrice = (e) => {
    let value = e.target.value;

    if (priceField?.money) {
      const digits = value.replace(/\D/g, "");

      value = digits
        ? Number(digits).toLocaleString("id-ID")
        : "";
    }

    setForm((prev) => ({
      ...prev,
      price: value,
    }));

    setDone(false);
  };

  // ==========================================
  // PILIH JENIS TRANSAKSI
  // ==========================================

  const chooseType = (id) => {
    setType(id);

    setForm((prev) => ({
      ...prev,
      price: "",
    }));

    setDone(false);
    setError("");
  };

  // ==========================================
  // TAMBAH FOTO
  // ==========================================

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) =>
      /^image\/(jpeg|png)$/.test(file.type)
    );

    const remaining = Math.max(
      0,
      MAX_PHOTOS - photos.length
    );

    const newPhotos = validFiles
      .slice(0, remaining)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      }));

    setPhotos((prev) => [
      ...prev,
      ...newPhotos,
    ]);

    if (!selectedPhotoId && newPhotos.length > 0) {
      setSelectedPhotoId(newPhotos[0].id);
    }

    if (validFiles.length === 0) {
      setError("Pilih foto JPG, JPEG, atau PNG.");
    } else if (validFiles.length > remaining) {
      setError("Maksimal hanya 5 foto.");
    } else if (validFiles.length !== files.length) {
      setError("Beberapa file bukan JPG atau PNG.");
    } else {
      setError("");
    }

    setDone(false);
    e.target.value = "";
  };

  // ==========================================
  // HAPUS FOTO
  // ==========================================

  const removePhoto = (id) => {
    const target = photos.find(
      (photo) => photo.id === id
    );

    if (target) {
      URL.revokeObjectURL(target.url);
    }

    const remainingPhotos = photos.filter(
      (photo) => photo.id !== id
    );

    setPhotos(remainingPhotos);

    if (selectedPhotoId === id) {
      setSelectedPhotoId(
        remainingPhotos[0]?.id || null
      );
    }

    setError("");
    setDone(false);
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      setError("Tambahkan minimal 1 foto barang.");
      return;
    }

    const payload = {
      type,
      ...form,
      price:
        type === "Donasi"
          ? null
          : priceField?.money
          ? Number(form.price.replace(/\D/g, ""))
          : form.price,
      photos: photos.map((photo) => photo.file),
    };

    console.log("Data barang:", payload);
    console.log("Pengguna:", currentUser);

    setError("");
    setDone(true);
  };

  // ==========================================
  // TAMPILAN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F7F9F8] font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="relative mx-auto flex h-[72px] max-w-5xl items-center justify-center px-5">

          <button
            type="button"
            onClick={handleBack}
            className="absolute left-5 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            ← Kembali
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="text-xl font-extrabold text-gray-900"
          >
            TradeMe
          </button>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8">

        {/* JUDUL */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-emerald-700">
            BARANG LAMA, MANFAAT BARU
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
            Unggah Barang
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Lengkapi informasi barang yang ingin kamu
            jual, tukar, lelang, atau donasikan.
          </p>
        </div>

        {/* JENIS TRANSAKSI */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TYPES.map((item) => {
            const active = type === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseType(item.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span
                  className={`block text-sm font-bold ${
                    active
                      ? "text-emerald-800"
                      : "text-gray-900"
                  }`}
                >
                  {item.id}
                </span>

                <span className="mt-1 block text-xs text-gray-500">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

            {/* ================================= */}
            {/* KOLOM KIRI - UPLOAD FOTO */}
            {/* ================================= */}

            <div className="min-w-0">

              <div className="flex min-h-[33rem] w-full flex-col rounded-2xl border-2 border-dashed border-emerald-200 bg-[#F7FAF8] p-4">

                {/* INPUT FILE */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={addPhotos}
                  className="hidden"
                />

                {/* BELUM ADA FOTO */}
                {photos.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">

                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16805D"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>

                    <p className="mt-3 text-sm font-bold text-emerald-700">
                      Tambahkan foto barang
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Unggah hingga 5 foto. Format JPG/PNG.
                    </p>

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-4 rounded-lg border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Pilih Foto
                    </button>

                  </div>
                ) : (
                  /* SUDAH ADA FOTO */
                  <div className="flex flex-1 flex-col items-center justify-center">

                    {/* FOTO UTAMA */}
                    <div className="relative flex h-[300px] w-full items-center justify-center rounded-xl bg-white">

                      <img
                        src={activePhoto.url}
                        alt={activePhoto.file.name}
                        className="h-full w-full rounded-xl object-contain"
                      />

                      {/* HAPUS FOTO UTAMA */}
                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(activePhoto.id)
                        }
                        aria-label="Hapus foto"
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-sm text-white shadow-md hover:bg-red-600"
                      >
                        ✕
                      </button>

                    </div>

                    {/* TOMBOL TAMBAH FOTO */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={
                        photos.length >= MAX_PHOTOS
                      }
                      className="mt-4 rounded-xl border border-emerald-700 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Tambah Foto ({photos.length}/{MAX_PHOTOS})
                    </button>

                    {/* THUMBNAIL */}
                    {photos.length > 1 && (
                      <div className="mt-5 grid w-full grid-cols-4 gap-2">

                        {photos.map((photo) => {
                          const active =
                            activePhoto.id === photo.id;

                          return (
                            <div
                              key={photo.id}
                              className="relative"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhotoId(photo.id)
                                }
                                className={`h-16 w-full overflow-hidden rounded-lg border-2 bg-white ${
                                  active
                                    ? "border-emerald-700"
                                    : "border-gray-200"
                                }`}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.file.name}
                                  className="h-full w-full object-contain"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removePhoto(photo.id)
                                }
                                aria-label={`Hapus ${photo.file.name}`}
                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] text-white hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}

                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* ERROR FOTO */}
              {error && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

            </div>

            {/* ================================= */}
            {/* KOLOM KANAN - FORM BARANG */}
            {/* ================================= */}

            <div className="min-w-0 space-y-5">

              {/* NAMA BARANG */}
              <Field label="Nama barang">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Contoh: Sepeda kota vintage"
                  className={inputClass}
                />
              </Field>

              {/* KATEGORI DAN KONDISI */}
              <div className="grid grid-cols-2 gap-4">

                <Field label="Kategori">
                  <select
                    required
                    value={form.category}
                    onChange={setField("category")}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Pilih kategori
                    </option>

                    {CATEGORIES.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Kondisi">
                  <select
                    required
                    value={form.condition}
                    onChange={setField("condition")}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Pilih kondisi
                    </option>

                    {CONDITIONS.map((condition) => (
                      <option
                        key={condition}
                        value={condition}
                      >
                        {condition}
                      </option>
                    ))}
                  </select>
                </Field>

              </div>

              {/* DESKRIPSI */}
              <Field label="Deskripsi">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={setField("description")}
                  placeholder="Ceritakan kondisi, ukuran, kelengkapan, dan kekurangan barang"
                  className={`${inputClass} resize-y`}
                />
              </Field>

              {/* HARGA */}
              {priceField && (
                <Field label={priceField.label}>
                  <input
                    type="text"
                    required
                    value={form.price}
                    onChange={setPrice}
                    inputMode={
                      priceField.money
                        ? "numeric"
                        : "text"
                    }
                    placeholder={priceField.placeholder}
                    className={inputClass}
                  />
                </Field>
              )}

              {/* YAYASAN PENERIMA */}
              {type === "Donasi" && (
                <Field label="Yayasan penerima">
                  <input
                    type="text"
                    value={form.recipient}
                    onChange={setField("recipient")}
                    placeholder="Contoh: Yayasan Kasih Anak"
                    className={inputClass}
                  />

                  <p className="mt-1 text-[11px] text-gray-400">
                    Terisi otomatis jika memilih yayasan
                    dari halaman donasi, boleh diubah.
                  </p>
                </Field>
              )}

              {/* LOKASI */}
              <Field label="Lokasi barang">
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={setField("location")}
                  placeholder="Kecamatan di Surabaya"
                  className={inputClass}
                />
              </Field>

              {/* NOTIFIKASI */}
              {done && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Data barang sudah disiapkan.
                  Silakan cek Console browser.
                  Data belum tersimpan ke backend.
                </div>
              )}

              {/* TOMBOL SUBMIT */}
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Terbitkan Barang
              </button>

            </div>

          </div>
        </form>

      </main>
    </div>
  );
}
