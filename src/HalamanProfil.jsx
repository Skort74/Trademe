import React, { useMemo, useState } from "react";
import "./HalamanProfil.css";

const INITIAL_LISTINGS = [
  { id: 1, name: "Set Meja Teras", type: "Jual", status: "Aktif" },
  { id: 2, name: "Rak Buku Serbaguna", type: "Donasi", status: "Dalam kurasi" },
  { id: 3, name: "Kursi Cafe Minimalis", type: "Lelang", status: "Aktif" },
];

const TRANSACTIONS = [
  { id: 1, name: "Sepeda Kota Vintage", type: "Pembelian", status: "Menunggu COD" },
  { id: 2, name: "Meja Kayu Jati", type: "Penukaran", status: "Selesai" },
  { id: 3, name: "Kursi Cafe", type: "Lelang", status: "Penawaran aktif" },
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
  currentUser,
  onUpdateProfile,
  onLogout,
}) {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "Pengguna TradeMe",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "Surabaya, Jawa Timur",
  });

  const profile = useMemo(
    () => ({
      fullName: currentUser?.fullName || "Pengguna TradeMe",
      email: currentUser?.email || "Email belum tersedia",
      phone: currentUser?.phone || "Nomor telepon belum ditambahkan",
      location: currentUser?.location || "Surabaya, Jawa Timur",
    }),
    [currentUser]
  );

  const openEditForm = () => {
    setForm({
      fullName: profile.fullName,
      phone: currentUser?.phone || "",
      location: profile.location,
    });
    setSaved(false);
    setIsEditing(true);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    onUpdateProfile?.({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
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
          <button className="tp-brand" type="button" onClick={() => onNavigate?.("home")}>
            <span className="tp-brand-mark">T</span>
            <span className="tp-brand-name">TradeMe</span>
          </button>

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

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <p className="tp-kicker">AKTIVITAS TERBARU</p>
              <h2>Riwayat Transaksi</h2>
            </div>
          </div>

          <div className="tp-table-wrap">
            <table className="tp-table tp-transaction-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((item) => (
                  <tr key={item.id}>
                    <td className="tp-item-name">{item.name}</td>
                    <td>{item.type}</td>
                    <td><StatusBadge>{item.status}</StatusBadge></td>
                    <td><button className="tp-view-button" type="button">Lihat</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button className="tp-logout" type="button" onClick={onLogout}>
          Keluar dari akun <span aria-hidden="true">→</span>
        </button>
      </main>

      {isEditing && (
        <div className="tp-modal-backdrop" role="presentation" onMouseDown={() => setIsEditing(false)}>
          <section
            className="tp-modal"
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
              <label>
                Lokasi
                <input
                  required
                  value={form.location}
                  onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))}
                />
              </label>

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
