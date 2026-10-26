import React, { useState, useMemo } from "react";
import "./TradeMeHome.css";

const ALL_PRODUCTS = [
  {
    id: 1,
    title: "Sepeda Kota Vintage",
    category: "Jual",
    priceText: "Rp750.000",
    isExchange: false,
    location: "Wonokromo",
    condition: "Baik",
    image: "/images/vintage-bike.jpg",
    catType: "Kendaraan",
    priceRange: "> Rp500.000",
  },
  {
    id: 2,
    title: "Meja Makan Kayu Jati",
    category: "Tukar",
    priceText: "Terbuka untuk ditukar",
    isExchange: true,
    location: "Rungkut",
    condition: "Sangat baik",
    image: "/images/meja-jati.jpg",
    catType: "Furnitur",
    priceRange: "Semua",
  },
  {
    id: 3,
    title: "Kursi Cafe Minimalis",
    category: "Lelang",
    priceText: "Mulai Rp280.000",
    isExchange: false,
    location: "Sukolilo",
    condition: "Baik",
    image: "/images/kursi-cafe.jpg",
    catType: "Furnitur",
    priceRange: "Rp250.000 - Rp500.000",
  },
  {
    id: 4,
    title: "Kamera Analog 35mm Vintage",
    category: "Jual",
    priceText: "Rp450.000",
    isExchange: false,
    location: "Tegalsari",
    condition: "Baik",
    image: "/images/hero-antique.jpg",
    catType: "Elektronik",
    priceRange: "Rp250.000 - Rp500.000",
  },
  {
    id: 5,
    title: "Gitar Akustik Klasik Yamaha",
    category: "Tukar",
    priceText: "Terbuka untuk ditukar",
    isExchange: true,
    location: "Gubeng",
    condition: "Sangat baik",
    image: "/images/vintage-bike.jpg",
    catType: "Musik",
    priceRange: "Semua",
  },
  {
    id: 6,
    title: "Lampu Meja Art Deco Kuningan",
    category: "Lelang",
    priceText: "Mulai Rp180.000",
    isExchange: false,
    location: "Genteng",
    condition: "Baik",
    image: "/images/kursi-cafe.jpg",
    catType: "Dekorasi",
    priceRange: "< Rp250.000",
  },
  {
    id: 7,
    title: "Set Piring Keramik Antik (12 pcs)",
    category: "Donasi",
    priceText: "Donasi Gratis",
    isExchange: false,
    location: "Wonocolo",
    condition: "Sangat baik",
    image: "/images/meja-jati.jpg",
    catType: "Peralatan",
    priceRange: "< Rp250.000",
  },
  {
    id: 8,
    title: "Rak Buku Kayu Pinus Rustic",
    category: "Donasi",
    priceText: "Donasi Gratis",
    isExchange: false,
    location: "Sawahan",
    condition: "Baik",
    image: "/images/hero-antique.jpg",
    catType: "Furnitur",
    priceRange: "< Rp250.000",
  },
];

export default function TradeMeHome() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Kategori");
  const [selectedCondition, setSelectedCondition] = useState("Kondisi");
  const [selectedLocation, setSelectedLocation] = useState("Lokasi");
  const [selectedPrice, setSelectedPrice] = useState("Harga");
  const [currentCity, setCurrentCity] = useState("Surabaya");
  const [favorites, setFavorites] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const filteredItems = useMemo(() => {
    return ALL_PRODUCTS.filter((item) => {
      // Tab filter
      if (activeTab !== "Semua" && item.category !== activeTab) {
        return false;
      }
      // Search
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.location.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Dropdown category
      if (selectedCategory !== "Kategori" && item.catType !== selectedCategory) {
        return false;
      }
      // Dropdown condition
      if (selectedCondition !== "Kondisi" && item.condition !== selectedCondition) {
        return false;
      }
      // Dropdown location
      if (selectedLocation !== "Lokasi" && item.location !== selectedLocation) {
        return false;
      }
      // Dropdown price
      if (selectedPrice !== "Harga" && item.priceRange !== selectedPrice) {
        return false;
      }
      return true;
    });
  }, [
    activeTab,
    searchQuery,
    selectedCategory,
    selectedCondition,
    selectedLocation,
    selectedPrice,
  ]);

  const getBadgeClass = (category) => {
    switch (category) {
      case "Jual":
        return "tm-badge-category tm-badge-jual";
      case "Tukar":
        return "tm-badge-category tm-badge-tukar";
      case "Lelang":
        return "tm-badge-category tm-badge-lelang";
      case "Donasi":
        return "tm-badge-category tm-badge-donasi";
      default:
        return "tm-badge-category";
    }
  };

  return (
    <div className="tm-app" onClick={() => setActiveDropdown(null)}>
      {/* ================= NAVBAR ================= */}
      <header className="tm-header">
        <div className="tm-nav-container">
          {/* Left Brand */}
          <div className="tm-brand">
            <div className="tm-brand-logo">T</div>
            <span className="tm-brand-name">TradeMe</span>
          </div>

          {/* Right Actions */}
          <div className="tm-nav-right">
            {/* CTA Button */}
            <button className="tm-btn-upload">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Unggah Barang</span>
            </button>

            {/* Chat with notification */}
            <div className="tm-nav-link">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="tm-badge-notification">2</span>
              <span className="tm-nav-text">Chat</span>
            </div>

            {/* Profil */}
            <div className="tm-nav-link">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              <span className="tm-nav-text">Profil</span>
            </div>

            {/* Hamburger Menu */}
            <button
              aria-label="Menu"
              className="tm-menu-toggle"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6.5h16M4 12h16M4 17.5h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="tm-main">
        {/* ================= HERO CARD ================= */}
        <section className="tm-hero-card">
          {/* Top text block */}
          <div className="tm-hero-content">
            <div className="tm-hero-tag">BARANG LAMA, MANFAAT BARU</div>

            <h1 className="tm-hero-title">
              Beri barang kesempatan{" "}
              <span className="tm-hero-highlight">kedua.</span>
            </h1>

            <p className="tm-hero-desc">
              Jual, tukar, lelang, atau donasikan barang layak pakai. Lebih hemat
              untuk sesama, lebih baik untuk bumi.
            </p>

            {/* Actions */}
            <div className="tm-hero-actions">
              <button
                className="tm-btn-primary"
                onClick={() => {
                  const el = document.getElementById("temukan-pilihanmu");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Jelajahi Barang</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <button
                className="tm-btn-donate"
                onClick={() => setActiveTab("Donasi")}
              >
                Mulai Berdonasi
              </button>
            </div>

            {/* Stats */}
            <div className="tm-hero-stats">
              <div className="tm-stat-item">
                <span className="tm-stat-number">12.480+</span>
                <span className="tm-stat-label">
                  barang mendapat pemilik baru
                </span>
              </div>

              <div className="tm-stat-divider" />

              <div className="tm-stat-item">
                <span className="tm-stat-number">2.150+</span>
                <span className="tm-stat-label">donasi tersalurkan</span>
              </div>
            </div>
          </div>

          {/* Bottom Hero Media */}
          <div className="tm-hero-media">
            <img
              src="/images/hero-antique.jpg"
              alt="Koleksi furnitur vintage dan barang antik layak pakai"
              className="tm-hero-img"
            />

            {/* Top gradient transition overlay */}
            <div className="tm-hero-gradient-overlay" />

            {/* Floating Escrow Verification Badge */}
            <div className="tm-escrow-badge">
              <div className="tm-escrow-icon-box">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#276B4E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="tm-escrow-title">Aman &amp; Terverifikasi</p>
                <p className="tm-escrow-subtitle">
                  Transaksi dilindungi escrow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION: TEMUKAN PILIHANMU ================= */}
        <section id="temukan-pilihanmu">
          {/* Subtitle tag */}
          <div className="tm-section-kicker">TEMUKAN PILIHANMU</div>

          {/* Header Row with Location Pill */}
          <div className="tm-section-header">
            <h2 className="tm-section-title">Barang terbaru di dekatmu</h2>

            <button
              className="tm-location-pill"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentCity((prev) =>
                  prev === "Surabaya" ? "Jakarta" : "Surabaya"
                );
              }}
              title="Klik untuk ubah kota"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#276B4E"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{currentCity}</span>
            </button>
          </div>

          {/* Primary Filters: Tabs & Search Input */}
          <div className="tm-filters-row">
            {/* Tabs */}
            <div className="tm-tabs-group">
              {["Semua", "Jual", "Tukar", "Lelang", "Donasi"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    className={`tm-tab-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div
              className="tm-search-box"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C9890"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tm-search-input"
              />
              {searchQuery && (
                <button
                  className="tm-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filters Dropdowns & Count */}
          <div className="tm-secondary-filters-row">
            <div className="tm-dropdown-group">
              {/* Kategori Dropdown */}
              <div
                className="tm-dropdown-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="tm-dropdown-btn"
                  onClick={() => toggleDropdown("kategori")}
                >
                  <span>{selectedCategory}</span>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="#516057"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>
                {activeDropdown === "kategori" && (
                  <div className="tm-dropdown-menu">
                    {[
                      "Kategori",
                      "Furnitur",
                      "Kendaraan",
                      "Elektronik",
                      "Dekorasi",
                      "Musik",
                      "Peralatan",
                    ].map((opt) => (
                      <div
                        key={opt}
                        className={`tm-dropdown-item ${
                          selectedCategory === opt ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedCategory(opt);
                          setActiveDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kondisi Dropdown */}
              <div
                className="tm-dropdown-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="tm-dropdown-btn"
                  onClick={() => toggleDropdown("kondisi")}
                >
                  <span>{selectedCondition}</span>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="#516057"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>
                {activeDropdown === "kondisi" && (
                  <div className="tm-dropdown-menu">
                    {["Kondisi", "Sangat baik", "Baik", "Cukup baik"].map(
                      (opt) => (
                        <div
                          key={opt}
                          className={`tm-dropdown-item ${
                            selectedCondition === opt ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedCondition(opt);
                            setActiveDropdown(null);
                          }}
                        >
                          {opt}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Lokasi Dropdown */}
              <div
                className="tm-dropdown-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="tm-dropdown-btn"
                  onClick={() => toggleDropdown("lokasi")}
                >
                  <span>{selectedLocation}</span>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="#516057"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>
                {activeDropdown === "lokasi" && (
                  <div className="tm-dropdown-menu">
                    {[
                      "Lokasi",
                      "Wonokromo",
                      "Rungkut",
                      "Sukolilo",
                      "Tegalsari",
                      "Gubeng",
                      "Genteng",
                      "Wonocolo",
                      "Sawahan",
                    ].map((opt) => (
                      <div
                        key={opt}
                        className={`tm-dropdown-item ${
                          selectedLocation === opt ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedLocation(opt);
                          setActiveDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Harga Dropdown */}
              <div
                className="tm-dropdown-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="tm-dropdown-btn"
                  onClick={() => toggleDropdown("harga")}
                >
                  <span>{selectedPrice}</span>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="#516057"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>
                {activeDropdown === "harga" && (
                  <div className="tm-dropdown-menu">
                    {[
                      "Harga",
                      "< Rp250.000",
                      "Rp250.000 - Rp500.000",
                      "> Rp500.000",
                    ].map((opt) => (
                      <div
                        key={opt}
                        className={`tm-dropdown-item ${
                          selectedPrice === opt ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedPrice(opt);
                          setActiveDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Counter */}
            <div className="tm-items-count">
              {filteredItems.length} barang ditemukan
            </div>
          </div>

          {/* ================= CARDS GRID ================= */}
          <div className="tm-cards-grid">
            {filteredItems.map((item) => {
              const isFav = favorites[item.id];
              return (
                <div key={item.id} className="tm-card">
                  {/* Card Media */}
                  <div className="tm-card-media">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="tm-card-img"
                    />

                    {/* Category Tag Badge */}
                    <div className={getBadgeClass(item.category)}>
                      {item.category}
                    </div>

                    {/* Heart Favorite Button */}
                    <button
                      className="tm-fav-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      aria-label="Favorit"
                      title={isFav ? "Hapus dari favorit" : "Tambah ke favorit"}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isFav ? "#E11D48" : "none"}
                        stroke={isFav ? "#E11D48" : "#243229"}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Card Content Body */}
                  <div className="tm-card-body">
                    <div>
                      <h3 className="tm-card-title">{item.title}</h3>

                      <div className="tm-card-price">
                        {item.isExchange ? (
                          <span className="tm-price-exchange">
                            {item.priceText}
                          </span>
                        ) : (
                          <span className="tm-price-val">
                            {item.priceText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="tm-card-footer">
                      <div className="tm-card-location">
                        <svg
                          width="11"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#79877F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{item.location}</span>
                      </div>

                      <span className="tm-card-condition">
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty fallback */}
            {filteredItems.length === 0 && (
              <div className="tm-empty-state">
                <p className="tm-empty-text">
                  Tidak ada barang yang cocok dengan filter yang dipilih.
                </p>
                <button
                  className="tm-reset-btn"
                  onClick={() => {
                    setActiveTab("Semua");
                    setSearchQuery("");
                    setSelectedCategory("Kategori");
                    setSelectedCondition("Kondisi");
                    setSelectedLocation("Lokasi");
                    setSelectedPrice("Harga");
                  }}
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="tm-footer">
          <p>© 2026 TradeMe · Memberi nilai baru pada barang lama.</p>
        </footer>
      </main>
    </div>
  );
}
