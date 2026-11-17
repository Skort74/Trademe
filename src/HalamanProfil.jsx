import React, { useEffect, useMemo, useState } from "react";
import "./HalamanProfil.css";
import BackButton from "./components/BackButton";
import GoogleMap from "./components/GoogleMap";
import RiwayatTransaksi from "./RiwayatTransaksi";
import {
  EMPTY_ADDRESS,
  REQUIRED_ADDRESS_FIELDS,
  isAddressComplete,
  formatAddress,
  addressMapQuery,
} from "./utils/address";

const ADDRESS_LABELS = {
  street: "Nama jalan, nomor rumah, blok",
  rtRw: "RT/RW",
  kelurahan: "Kelurahan / desa",
  kecamatan: "Kecamatan",
  city: "Kota / kabupaten",
  province: "Provinsi",
  postalCode: "Kode pos",
  notes: "Patokan (opsional)",
};

const INITIAL_LISTINGS = [
  { id: 1, name: "Set Meja Teras", type: "Jual", status: "Aktif" },
  { id: 2, name: "Rak Buku Serbaguna", type: "Donasi", status: "Dalam kurasi" },
  { id: 3, name: "Kursi Cafe Minimalis", type: "Lelang", status: "Aktif" },
];


function getInitials(name = "Pengguna TradeMe") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ children }) {
  return <span className="tp-status">{children}</span>;
}

export default function HalamanProfil({
  onNavigate,
  onGoBack,
  currentUser,
  onUpdateProfile,
  onLogout,
  openAddressEditor = false,
}) {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "Pengguna TradeMe",
    phone: currentUser?.phone || "",
    address: { ...EMPTY_ADDRESS, ...(currentUser?.address || {}) },
  });

  const address = currentUser?.address || null;
  const addressReady = isAddressComplete(address);

  const profile = useMemo(
    () => ({
      fullName: currentUser?.fullName || "Pengguna TradeMe",
      email: currentUser?.email || "Email belum tersedia",
      phone: currentUser?.phone || "Nomor telepon belum ditambahkan",
      location:
        currentUser?.address?.kecamatan && currentUser?.address?.city
          ? `${currentUser.address.kecamatan}, ${currentUser.address.city}`
          : currentUser?.location || "Alamat belum dilengkapi",
    }),
    [currentUser]
  );

  const openEditForm = () => {
    setForm({
      fullName: profile.fullName,
      phone: currentUser?.phone || "",
      address: { ...EMPTY_ADDRESS, ...(currentUser?.address || {}) },
    });
    setFormError("");
    setSaved(false);
    setIsEditing(true);
  };

  // Dibuka dari checkout (Delivery) → langsung tampilkan form alamat
  useEffect(() => {
    if (openAddressEditor && currentUser) openEditForm();
  }, [openAddressEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAddressField = (key) => (event) =>
    setForm((value) => ({ ...value, address: { ...value.address, [key]: event.target.value } }));

  const saveProfile = (event) => {
    event.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(form.address).map(([k, v]) => [k, String(v || "").trim()])
    );
    const missing = REQUIRED_ADDRESS_FIELDS.filter((k) => !trimmed[k]);
    if (missing.length) {
      setFormError(`Lengkapi: ${missing.map((k) => ADDRESS_LABELS[k]).join(", ")}.`);
      return;
    }
    if (!/^\d{5}$/.test(trimmed.postalCode)) {
      setFormError("Kode pos harus 5 digit angka.");
      return;
    }
    onUpdateProfile?.({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: trimmed,
      location: `${trimmed.kecamatan}, ${trimmed.city}`,
    });
    setIsEditing(false);
    setSaved(true);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    onNavigate?.("home", { searchQuery: search.trim() });
  };

  return (
    <div className="tp-page">
      <header className="tp-header">
        <div className="tp-nav">
          <div className="tp-nav-start">
            <BackButton onClick={onGoBack} />
            <button className="tp-brand" type="button" onClick={() => onNavigate?.("home")}>
              <span className="tp-brand-mark">T</span>
              <span className="tp-brand-name">TradeMe</span>
            </button>
          </div>

          <form className="tp-search" onSubmit={submitSearch}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari barang di Surabaya..."
              aria-label="Cari barang"
            />
          </form>

          <nav className="tp-actions" aria-label="Navigasi utama">
            <button className="tp-upload" type="button" onClick={() => onNavigate?.("unggah")}>
              <span aria-hidden="true">＋</span>
              <span className="tp-action-label">Unggah Barang</span>
            </button>

            <button className="tp-nav-action" type="button" onClick={() => onNavigate?.("chat")}>
              <span className="tp-chat-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                </svg>
                <span className="tp-notification">2</span>
              </span>
              <span className="tp-action-label">Chat</span>
            </button>

            <button className="tp-nav-action tp-active-profile" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
              <span className="tp-action-label">{profile.fullName.split(" ")[0]}</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="tp-main">
        <section className="tp-profile-card">
          <div className="tp-avatar" aria-hidden="true">{getInitials(profile.fullName)}</div>

          <div className="tp-identity">
            <div className="tp-verified">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 14 5.1l2.9-.1.8 2.8 2.4 1.7-1 2.7 1 2.7-2.4 1.7-.8 2.8-2.9-.1L12 21l-2-2.1-2.9.1-.8-2.8-2.4-1.7 1-2.7-1-2.7 2.4-1.7.8-2.8 2.9.1Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Akun terverifikasi
            </div>
            <h1>{profile.fullName}</h1>
            <p>{profile.email} <span>•</span> {profile.phone}</p>
            <p className="tp-location">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {profile.location}
            </p>
          </div>

          <button className="tp-outline-button" type="button" onClick={openEditForm}>
            Ubah Profil
          </button>
        </section>

        {saved && (
          <div className="tp-success" role="status">
            Profil berhasil diperbarui.
          </div>
        )}

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <p className="tp-kicker">PENGIRIMAN</p>
              <h2>Alamat Rumah</h2>
            </div>
            <button className="tp-outline-button tp-address-button" type="button" onClick={openEditForm}>
              {addressReady ? "Ubah Alamat" : "Lengkapi Alamat"}
            </button>
          </div>

          {addressReady ? (
            <div className="tp-address-grid">
              <div>
                <p className="tp-address-text">{formatAddress(address)}</p>
                {address.notes && <p className="tp-address-notes">Patokan: {address.notes}</p>}
                <p className="tp-address-hint">
                  Alamat ini otomatis dipakai saat kamu memilih Delivery di halaman pembayaran.
                </p>
              </div>
              <GoogleMap query={addressMapQuery(address)} height={220} title="Alamat rumah" />
            </div>
          ) : (
            <div className="tp-address-empty">
              Alamat rumah belum lengkap. Lengkapi alamat agar bisa memakai Delivery saat membeli barang.
            </div>
          )}
        </section>

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <p className="tp-kicker">KELOLA LISTING</p>
              <h2>Barang Saya</h2>
            </div>
            <button className="tp-upload tp-section-upload" type="button" onClick={() => onNavigate?.("unggah")}>
              <span aria-hidden="true">＋</span> Unggah Barang
            </button>
          </div>

          <div className="tp-table-wrap">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id}>
                    <td className="tp-item-name">{item.name}</td>
                    <td>{item.type}</td>
                    <td><StatusBadge>{item.status}</StatusBadge></td>
                    <td>
                      <div className="tp-row-actions">
                        <button type="button">Lihat</button>
                        <button type="button" onClick={() => onNavigate?.("unggah")}>Ubah</button>
                        <button
                          className="tp-delete"
                          type="button"
                          onClick={() => setListings((items) => items.filter((listing) => listing.id !== item.id))}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr>
                    <td className="tp-empty" colSpan="4">Belum ada barang yang ditampilkan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <RiwayatTransaksi currentUser={currentUser} onNavigate={onNavigate} />

        <button className="tp-logout" type="button" onClick={onLogout}>
          Keluar dari akun <span aria-hidden="true">→</span>
        </button>
      </main>

      {isEditing && (
        <div className="tp-modal-backdrop" role="presentation" onMouseDown={() => setIsEditing(false)}>
          <section
            className="tp-modal tp-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="tp-modal-heading">
              <div>
                <p className="tp-kicker">INFORMASI AKUN</p>
                <h2 id="edit-profile-title">Ubah Profil</h2>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setIsEditing(false)}>×</button>
            </div>

            <form onSubmit={saveProfile}>
              <label>
                Nama lengkap
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))}
                />
              </label>
              <label>
                Nomor telepon
                <input
                  value={form.phone}
                  onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
                  placeholder="Contoh: 0812 3456 7890"
                />
              </label>
              <fieldset className="tp-address-fieldset">
                <legend>Alamat rumah lengkap</legend>
                <label>
                  {ADDRESS_LABELS.street} <span className="tp-required">*</span>
                  <input
                    value={form.address.street}
                    onChange={setAddressField("street")}
                    placeholder="Contoh: Jl. Raya Darmo No. 25, Blok B"
                  />
                </label>
                <div className="tp-grid-2">
                  <label>
                    {ADDRESS_LABELS.rtRw}
                    <input value={form.address.rtRw} onChange={setAddressField("rtRw")} placeholder="003/005" />
                  </label>
                  <label>
                    {ADDRESS_LABELS.kelurahan} <span className="tp-required">*</span>
                    <input value={form.address.kelurahan} onChange={setAddressField("kelurahan")} placeholder="Darmo" />
                  </label>
                  <label>
                    {ADDRESS_LABELS.kecamatan} <span className="tp-required">*</span>
                    <input value={form.address.kecamatan} onChange={setAddressField("kecamatan")} placeholder="Wonokromo" />
                  </label>
                  <label>
                    {ADDRESS_LABELS.city} <span className="tp-required">*</span>
                    <input value={form.address.city} onChange={setAddressField("city")} placeholder="Surabaya" />
                  </label>
                  <label>
                    {ADDRESS_LABELS.province} <span className="tp-required">*</span>
                    <input value={form.address.province} onChange={setAddressField("province")} placeholder="Jawa Timur" />
                  </label>
                  <label>
                    {ADDRESS_LABELS.postalCode} <span className="tp-required">*</span>
                    <input
                      value={form.address.postalCode}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          address: { ...value.address, postalCode: event.target.value.replace(/\D/g, "").slice(0, 5) },
                        }))
                      }
                      inputMode="numeric"
                      placeholder="60241"
                    />
                  </label>
                </div>
                <label>
                  {ADDRESS_LABELS.notes}
                  <input
                    value={form.address.notes}
                    onChange={setAddressField("notes")}
                    placeholder="Contoh: Pagar hitam, sebelah masjid"
                  />
                </label>
                {addressMapQuery(form.address) && (
                  <GoogleMap query={addressMapQuery(form.address)} height={170} title="Pratinjau alamat" />
                )}
              </fieldset>

              {formError && <p className="tp-form-error">{formError}</p>}

              <div className="tp-modal-actions">
                <button className="tp-cancel" type="button" onClick={() => setIsEditing(false)}>Batal</button>
                <button className="tp-save" type="submit">Simpan Perubahan</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
