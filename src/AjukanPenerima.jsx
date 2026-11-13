import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./TradeMeLayout";

const inputCls =
  "w-full rounded-xl border border-trade-border bg-white px-3.5 py-3 text-sm text-trade-dark outline-none transition placeholder:text-trade-muted/70 focus:border-trade-500 focus:ring-2 focus:ring-trade-500/20";
const MAX_FILES = 5;
const TIPE = [
  { value: "yayasan", label: "Yayasan" },
  { value: "perorangan", label: "Perorangan" },
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}

export default function AjukanPenerima({ onClose, recipientType = "" }) {
  const isRegisteringPerson = recipientType === "perorangan";

  // Nama key sama dengan variabel di ketentuan backend
  const [form, setForm] = useState({
    tipe_penerima: recipientType,
    nama_lembaga: "",
    nama_penerima: "",
    lokasi: "",
    alasan_kebutuhan: "",
  });
  const [files, setFiles] = useState([]); // dokumen_pendukung (opsional)
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  // Tutup dengan tombol Esc, dan kunci scroll halaman selama pop-up terbuka
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addFiles = (e) => {
    const picked = Array.from(e.target.files).filter((f) =>
      /^(image\/(jpe?g|png)|application\/pdf)$/.test(f.type),
    );
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(); // multipart, karena ada file
    data.append("alasan_kebutuhan", form.alasan_kebutuhan.trim());
    data.append("tipe_penerima", form.tipe_penerima);
    if (form.tipe_penerima === "yayasan") {
      data.append("nama_lembaga", form.nama_lembaga.trim());
    } else if (form.tipe_penerima === "perorangan") {
      data.append("nama_penerima", form.nama_penerima.trim());
    }
    data.append("lokasi", form.lokasi.trim());
    files.forEach((f) => data.append("dokumen_pendukung", f));

    // TODO: kirim ke backend setelah endpoint siap, mis.
    // fetch(`${API_URL}/penerima`, { method: "POST", body: data });
    // (jangan atur header Content-Type sendiri untuk FormData)
    console.log("Pengajuan penerima:", Array.from(data.entries()));
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-trade-dark/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajukan-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        {done ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-trade-100 text-trade-500">
              <Icon size={24} sw={2.2}>
                <path d="m5 12 5 5 9-10" />
              </Icon>
            </span>
            <h2 id="ajukan-title" className="mt-4 text-lg font-extrabold">
              {isRegisteringPerson ? "Pendaftaran terkirim" : "Pengajuan terkirim"}
            </h2>
            <p className="mt-1 text-sm text-trade-muted">
              {isRegisteringPerson
                ? "Tim TradeMe akan memverifikasi data calon penerima sebelum ditampilkan."
                : "Tim TradeMe akan memverifikasi datamu sebelum kamu terdaftar sebagai penerima."}
            </p>
            <p className="mt-3 text-[11px] text-trade-muted">
              Catatan pengembangan: belum terhubung ke backend (data dicetak di console).
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-trade-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-trade-600"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] text-trade-500">
                  {isRegisteringPerson ? "DAFTARKAN CALON PENERIMA" : "BUTUH BANTUAN BARANG?"}
                </p>
                <h2 id="ajukan-title" className="mt-1 text-xl font-extrabold tracking-tight">
                  {isRegisteringPerson
                    ? "Daftarkan mereka yang membutuhkan"
                    : "Ajukan sebagai penerima donasi"}
                </h2>
                <p className="mt-1 text-xs text-trade-muted">
                  {isRegisteringPerson
                    ? "Isi data calon penerima agar tim TradeMe dapat melakukan verifikasi."
                    : "Isi data berikut agar tim TradeMe dapat memverifikasi pengajuanmu."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1 text-trade-muted hover:bg-trade-50 hover:text-trade-dark"
              >
                <Icon size={18} sw={2.2}>
                  <path d="M6 6l12 12M18 6 6 18" />
                </Icon>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!recipientType && (
              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold">Tipe penerima</legend>
                <div className="grid grid-cols-2 gap-3">
                  {TIPE.map((t) => (
                    <label key={t.value} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="tipe_penerima"
                        value={t.value}
                        required
                        checked={form.tipe_penerima === t.value}
                        onChange={setField("tipe_penerima")}
                        className="peer sr-only"
                      />
                      <span className="block rounded-xl border border-trade-border bg-white py-3 text-center text-sm font-semibold transition peer-checked:border-trade-500 peer-checked:bg-trade-50 peer-checked:text-trade-600 peer-checked:ring-1 peer-checked:ring-trade-500 peer-focus-visible:ring-2 peer-focus-visible:ring-trade-500/40">
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              )}

              {form.tipe_penerima === "yayasan" && (
                <Field label="Nama yayasan">
                  <input
                    type="text"
                    required
                    value={form.nama_lembaga}
                    onChange={setField("nama_lembaga")}
                    placeholder="Contoh: Yayasan Kasih Anak"
                    className={inputCls}
                  />
                </Field>
              )}

              {form.tipe_penerima === "perorangan" && (
                <Field label="Nama calon penerima">
                  <input
                    type="text"
                    required
                    value={form.nama_penerima}
                    onChange={setField("nama_penerima")}
                    placeholder="Contoh: Ibu Siti Aminah"
                    className={inputCls}
                  />
                </Field>
              )}

              <Field label="Lokasi">
                <input
                  type="text"
                  required
                  value={form.lokasi}
                  onChange={setField("lokasi")}
                  placeholder="Kota atau kecamatan, contoh: Wonokromo, Surabaya"
                  className={inputCls}
                />
              </Field>

              <Field label="Alasan kebutuhan">
                <textarea
                  rows={4}
                  required
                  value={form.alasan_kebutuhan}
                  onChange={setField("alasan_kebutuhan")}
                  placeholder={
                    isRegisteringPerson
                      ? "Ceritakan kondisi dan alasan calon penerima membutuhkan bantuan barang."
                      : "Ceritakan mengapa kamu membutuhkan bantuan barang."
                  }
                  className={`${inputCls} resize-y`}
                />
              </Field>

              <div>
                <span className="mb-1.5 block text-xs font-semibold">
                  Dokumen pendukung <span className="font-normal text-trade-muted">(opsional)</span>
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  multiple
                  onChange={addFiles}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  disabled={files.length >= MAX_FILES}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-trade-200 bg-trade-50 px-4 py-4 text-sm font-semibold text-trade-500 transition hover:bg-trade-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon size={16} sw={2.2}>
                    <path d="M12 5v14M5 12h14" />
                  </Icon>
                  Pilih dokumen
                </button>
                <p className="mt-1 text-[11px] text-trade-muted">
                  Foto KTP, SKTM, atau foto kondisi. JPG, PNG, atau PDF, maksimal {MAX_FILES} file.
                </p>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between rounded-lg bg-trade-bg px-3 py-2 text-xs"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          aria-label={`Hapus ${f.name}`}
                          className="ml-3 text-trade-muted hover:text-trade-dark"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-trade-border bg-white py-3 text-sm font-semibold transition hover:bg-trade-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-trade-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-trade-600 active:bg-trade-700"
                >
                  {isRegisteringPerson ? "Daftarkan Penerima" : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
