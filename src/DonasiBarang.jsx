import React, { useState } from "react";
import { SiteHeader, SiteFooter, Icon } from "./TradeMeLayout";

// Foto taruh di public/images/. Kalau file belum ada, area foto tampil hijau polos.
const RECIPIENTS = [
  {
    id: 1,
    type: "Yayasan",
    name: "Yayasan Kasih Anak",
    desc: "Panti asuhan dan pendidikan anak",
    area: "Wonokromo",
    km: 2.4,
    image: "/images/donasi-1.jpg",
  },
  {
    id: 2,
    type: "Yayasan",
    name: "Rumah Harapan Surabaya",
    desc: "Rumah singgah dan pendampingan keluarga",
    area: "Rungkut",
    km: 5.1,
    image: "/images/donasi-2.jpg",
  },
  {
    id: 3,
    type: "Yayasan",
    name: "Komunitas Berbagi Sesama",
    desc: "Relawan penyalur kebutuhan harian",
    area: "Gubeng",
    km: 3,
    image: "/images/donasi-3.jpg",
  },
  // Data contoh penerima perorangan, ganti sesuai kebutuhan
  {
    id: 4,
    type: "Penerima Perorangan",
    name: "Ibu Siti Rahmawati",
    desc: "Ibu tunggal, butuh perlengkapan sekolah anak",
    area: "Sawahan",
    km: 4.2,
    image: "/images/donasi-4.jpg",
  },
  {
    id: 5,
    type: "Penerima Perorangan",
    name: "Bapak Hendra Wijaya",
    desc: "Pensiunan, butuh perabot rumah sederhana",
    area: "Tegalsari",
    km: 1.8,
    image: "/images/donasi-5.jpg",
  },
  {
    id: 6,
    type: "Penerima Perorangan",
    name: "Keluarga Pak Darmo",
    desc: "Butuh pakaian layak pakai dan peralatan dapur",
    area: "Genteng",
    km: 3.6,
    image: "/images/donasi-6.jpg",
  },
];

const FILTERS = ["Yayasan", "Penerima Perorangan"];

function Photo({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export default function DonasiBarang() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const list = RECIPIENTS.filter((r) => r.type === filter);

  return (
    <div className="flex min-h-screen flex-col bg-trade-bg font-sans text-trade-dark">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        {/* Hero */}
        <section className="grid overflow-hidden rounded-3xl bg-trade-100 md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="text-[11px] font-bold tracking-[0.14em] text-trade-500">
              DONASI TERVERIFIKASI
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Barang sederhana, <span className="text-trade-500">dampak luar biasa.</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm text-trade-muted">
              Salurkan barang layak pakai langsung ke yayasan dan komunitas yang sudah diverifikasi
              tim TradeMe.
            </p>
          </div>
          <div className="relative min-h-[13rem] bg-trade-200">
            <Photo src="/images/donasi-hero.jpg" alt="Relawan menyiapkan barang donasi" />
          </div>
        </section>

        {/* Daftar penerima */}
        <section className="mt-10">
          <p className="text-[11px] font-bold tracking-[0.14em] text-trade-500">
            PENERIMA TERVERIFIKASI
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight">Pilih tujuan donasimu</h2>
            <div className="flex gap-1 rounded-xl border border-trade-border bg-white p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f
                      ? "bg-trade-500 text-white"
                      : "text-trade-muted hover:text-trade-dark"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl border border-trade-border bg-white shadow-sm"
              >
                <div className="relative h-36 bg-trade-200">
                  <Photo src={r.image} alt={r.name} />
                </div>
                <div className="p-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-trade-500">
                    <Icon size={12} sw={2.2}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </Icon>
                    Terverifikasi
                  </span>
                  <h3 className="mt-1.5 text-sm font-bold">{r.name}</h3>
                  <p className="mt-0.5 text-xs text-trade-muted">{r.desc}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-trade-muted">
                    <Icon size={11} sw={2}>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </Icon>
                    {r.area} · {r.km.toLocaleString("id-ID")} km
                  </p>
                  <a
                    href={`/unggah?jenis=Donasi&penerima=${encodeURIComponent(r.name)}`}
                    className="mt-3 block rounded-xl bg-trade-500 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-trade-600 hover:text-white hover:no-underline"
                  >
                    Donasikan Barang
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Banner ajukan penerima */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-trade-gold/20 px-6 py-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-trade-500">
                BUTUH BANTUAN BARANG?
              </p>
              <p className="mt-1 text-lg font-extrabold">Ajukan diri sebagai penerima donasi</p>
              <p className="mt-0.5 text-xs text-trade-muted">
                Yayasan atau komunitas dapat mendaftar untuk diverifikasi tim TradeMe.
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-trade-border bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-trade-50"
            >
              Ajukan Sebagai Penerima →
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
