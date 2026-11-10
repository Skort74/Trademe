import React from "react";

export function Icon({ size = 18, sw = 1.8, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-2 text-trade-dark hover:text-trade-dark hover:no-underline"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-trade-500 text-sm font-bold text-white">
        T
      </span>
      <span className="text-base font-bold">TradeMe</span>
    </a>
  );
}

const navItem =
  "relative flex items-center gap-1.5 text-sm font-medium text-trade-dark transition hover:text-trade-600";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-trade-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
        <Logo />

        {/* Pencarian: hanya tampil di layar lebar */}
        <div className="relative hidden max-w-xs flex-1 md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-trade-muted">
            <Icon size={14} sw={2.2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </Icon>
          </span>
          <input
            type="text"
            placeholder="Cari barang, lokasi, atau kategori..."
            className="w-full rounded-xl border border-trade-border bg-trade-bg py-2 pl-9 pr-3 text-sm text-trade-dark outline-none placeholder:text-trade-muted/70 focus:border-trade-500"
          />
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          <a
            href="/unggah"
            className="flex items-center gap-1.5 rounded-xl bg-trade-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-trade-600 hover:text-white hover:no-underline"
          >
            <Icon size={15} sw={2.5}>
              <path d="M12 5v14M5 12h14" />
            </Icon>
            Unggah Barang
          </a>
          <button type="button" className={navItem}>
            <Icon size={19}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </Icon>
            <span className="absolute -left-1 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              2
            </span>
            Chat
          </button>
          <button type="button" className={navItem}>
            <Icon size={19}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </Icon>
            Profil
          </button>
        </nav>

        {/* Hamburger: hanya di mobile */}
        <button
          type="button"
          aria-label="Menu"
          className="rounded-lg p-1.5 text-trade-dark hover:bg-trade-50 md:hidden"
        >
          <Icon size={21} sw={2.1}>
            <path d="M4 6.5h16M4 12h16M4 17.5h16" />
          </Icon>
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-trade-border bg-white">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[11px] text-trade-muted">
              Memberi nilai baru pada barang lama.
            </span>
          </div>
          <nav className="flex gap-4 text-xs font-medium">
            {["Bantuan", "Profil", "Keluar"].map((label) => (
              <button
                key={label}
                type="button"
                className="text-trade-dark transition hover:text-trade-600"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <p className="mt-4 border-t border-trade-border pt-4 text-[11px] text-trade-muted">
          © 2026 TradeMe. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}
