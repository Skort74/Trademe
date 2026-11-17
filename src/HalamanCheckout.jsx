import React, { useState } from "react";
import { getCurrentSession } from "./utils/auth";
import { isAddressComplete, formatAddress, addressMapQuery } from "./utils/address";
import BackButton from "./components/BackButton";
import GoogleMap from "./components/GoogleMap";
import LocationPicker from "./components/LocationPicker";
import { getSellerOf } from "./utils/chat";
import { transactions } from "./utils/adminStore";
import { completeOffer, getOffers } from "./utils/negotiation";

const COD_PAYMENT = "COD (bayar di tempat)";

const fmtRp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fmtDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function HalamanCheckout({ product, onBack, onGoBack, onNavigate, onLogout, currentUser }) {
  const item = product || {
    title: "Sepeda Kota Vintage",
    category: "Jual",
    priceText: "Rp750.000",
    image: "/images/vintage-bike.jpg",
    location: "Wonokromo",
  };

  const [deliveryMethod, setDeliveryMethod] = useState("COD"); // "COD" | "Delivery"
  const [meetingTime, setMeetingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank BCA");
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingPoint, setMeetingPoint] = useState(null); // { label, query } untuk COD
  const [errors, setErrors] = useState({});

  const user = currentUser || getCurrentSession();
  const homeAddress = user?.address || null;
  const addressReady = isAddressComplete(homeAddress);
  const sellerName = item.seller || getSellerOf(item).name;
  // Jadwal paling cepat 1 jam dari sekarang
  const minMeetingTime = toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000));

  // Compute pricing (pakai harga barang / harga deal, bukan angka tetap)
  const rawPrice =
    Number(item.dealPrice || item.price) ||
    Number(String(item.priceText || "").replace(/\D/g, "")) ||
    0;
  const serviceFee = 5000;
  const totalPrice = rawPrice + serviceFee;

  // COD: pembayaran dilakukan langsung saat bertemu → metode pembayaran terkunci
  const isCOD = deliveryMethod === "COD";
  const effectivePaymentMethod = isCOD ? COD_PAYMENT : paymentMethod;

  // Cegah bayar dua kali: deal / transaksi yang sudah dibayar atau dibatalkan tidak bisa dibayar lagi
  const linkedOffer = item.offerId ? getOffers().find((o) => o.id === item.offerId) : null;
  const linkedTx = item.transactionId ? transactions.all().find((t) => t.id === item.transactionId) : null;
  let payBlocked = "";
  if (item.offerId && linkedOffer?.status !== "accepted") {
    payBlocked = linkedOffer?.status === "completed"
      ? "Deal ini sudah dibayar. Lihat statusnya di Profil → Riwayat Transaksi."
      : "Deal ini sudah dibatalkan atau tidak berlaku lagi.";
  } else if (item.transactionId && linkedTx?.status !== "Menunggu Pembayaran") {
    payBlocked = linkedTx ? `Transaksi ini berstatus "${linkedTx.status}" dan tidak perlu dibayar lagi.` : "Transaksi tidak ditemukan.";
  }

  const validate = () => {
    if (payBlocked) return false;
    const next = {};
    if (deliveryMethod === "COD" && !meetingPoint) next.meetingPoint = "Pilih lokasi pertemuan di peta.";
    if (deliveryMethod === "Delivery" && !addressReady) next.address = "Lengkapi alamat rumah di profil untuk memakai Delivery.";
    if (!meetingTime) next.meetingTime = "Pilih tanggal dan waktu.";
    else if (new Date(meetingTime) < new Date(Date.now() + 55 * 60 * 1000)) next.meetingTime = "Jadwal minimal 1 jam dari sekarang.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePayNow = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsProcessing(true);

    // Data pembayaran & serah terima
    const buyer = user;
    const payment = {
      serviceFee,
      total: totalPrice,
      paymentMethod: effectivePaymentMethod,
      deliveryMethod,
      meetingTime: meetingTime ? new Date(meetingTime).toISOString() : null,
      meetingLocation: deliveryMethod === "COD" ? meetingPoint : null,
      deliveryAddress: deliveryMethod === "Delivery" ? formatAddress(homeAddress) : null,
      notes: notes.trim(),
      // COD dibayar saat bertemu; selain itu dana langsung masuk escrow
      status: isCOD ? "Menunggu COD" : "Dibayar",
      paidAt: isCOD ? null : new Date().toISOString(),
    };

    if (linkedTx) {
      // Transaksi yang sudah ada (mis. pemenang lelang) → cukup diperbarui
      transactions.update(linkedTx.id, payment);
    } else {
      // Catat transaksi baru agar muncul di Panel Admin & Riwayat Transaksi
      transactions.add({
        itemId: item.id ?? null,
        itemTitle: item.title,
        itemImage: item.image || item.images?.[0] || "",
        category: item.category,
        buyerId: buyer?.username || "tamu",
        buyerName: buyer?.fullName || buyer?.username || "Tamu",
        sellerName,
        amount: rawPrice,
        ...payment,
        source: item.isInstantAuctionBuy ? "Beli langsung lelang" : item.dealPrice ? "Harga hasil negosiasi" : "Checkout",
        offerId: item.offerId || null,
      });
    }

    // Deal hasil negosiasi selesai → tidak bisa dibayar dua kali
    if (item.offerId) completeOffer(item.offerId, { cod: isCOD });

    setTimeout(() => {
      setIsProcessing(false);
      if (onNavigate) {
        onNavigate(
          "payment_success",
          { product: item, paymentInfo: { cod: isCOD, total: totalPrice, meetingTime, meetingPoint } },
          { replace: true }
        );
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-plusJakartaSans text-[#1F2A24] flex flex-col justify-between">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
          <BackButton onClick={onGoBack} />
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Ke beranda"
          >
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none tracking-[-0.0368em]">
                T
              </span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">
              TradeMe
            </span>
          </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#1F2A24] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1">
        {/* Breadcrumb / Eyebrow */}
        <p className="text-[#2F7D5B] text-[11px] font-extrabold leading-[16.5px] tracking-[0.1636em] uppercase mb-2">
          Langkah Terakhir
        </p>

        {/* Heading */}
        <h1 className="text-3xl sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-7">
          Pembayaran & serah terima
        </h1>

        {payBlocked && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-semibold text-amber-800">{payBlocked}</p>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("profile")}
              className="px-4 py-2 rounded-lg bg-[#2F7D5B] hover:bg-[#25664a] text-white text-xs font-bold shrink-0"
            >
              Ke Riwayat Transaksi
            </button>
          </div>
        )}

        {/* 1. Item Summary Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex items-center justify-between gap-4 mb-6 shadow-xs">
          <div className="flex items-center gap-3.5">
            <img
              src={item.image || "/images/vintage-bike.jpg"}
              alt={item.title}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-gray-100"
            />
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EF] text-[#2F7D5B] inline-block mb-1">
                {item.category || "Jual"}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#1F2A24] line-clamp-1">
                {item.title}
              </h2>
              <p className="text-xs text-[#718096] mt-0.5">
                Dijual oleh {sellerName}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-bold text-[#1F2A24]">
              {fmtRp(rawPrice)}
            </span>
          </div>
        </div>

        {/* 2. Metode Serah Terima Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 mb-6 shadow-xs">
          <h2 className="text-base font-bold text-[#1F2A24] mb-3.5">
            Metode serah terima
          </h2>

          {/* Delivery Method Options */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* COD Tab */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("COD")}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all ${
                deliveryMethod === "COD"
                  ? "border-2 border-[#2F7D5B] bg-[#F9FCFA] shadow-xs"
                  : "border border-[#DCE6DF] bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-sm text-[#1F2A24]">COD</div>
              <div className="text-xs text-[#718096] mt-0.5">Cek barang langsung</div>
            </button>

            {/* Delivery Tab */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("Delivery")}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all ${
                deliveryMethod === "Delivery"
                  ? "border-2 border-[#2F7D5B] bg-[#F9FCFA] shadow-xs"
                  : "border border-[#DCE6DF] bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-sm text-[#1F2A24]">Delivery</div>
              <div className="text-xs text-[#718096] mt-0.5">Dikirim ke alamatmu</div>
            </button>
          </div>

          {deliveryMethod === "COD" ? (
            <div className="mb-5">
              <label className="text-xs font-bold text-[#1F2A24] block mb-1">
                Lokasi pertemuan <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-[#718096] mb-2">
                Pilih tempat umum yang mudah dijangkau, misalnya taman, minimarket, atau kafe.
                Barang berada di sekitar {item.location || "Surabaya"}.
              </p>
              <LocationPicker
                value={meetingPoint}
                onChange={(v) => {
                  setMeetingPoint(v);
                  setErrors((e) => ({ ...e, meetingPoint: "" }));
                }}
                defaultQuery={`${item.location || "Surabaya"}, Surabaya`}
              />
              {errors.meetingPoint && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.meetingPoint}</p>}
            </div>
          ) : (
            <div className="mb-5">
              <label className="text-xs font-bold text-[#1F2A24] block mb-1">Alamat pengiriman</label>
              {addressReady ? (
                <>
                  <div className="rounded-xl border border-[#D2E7DA] bg-[#F6FAF7] p-3 mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1F2A24]">{user?.fullName || "Alamat rumah"}{user?.phone ? ` · ${user.phone}` : ""}</p>
                      <p className="text-xs text-[#516057] mt-0.5">{formatAddress(homeAddress)}</p>
                      {homeAddress.notes && <p className="text-[11px] text-[#718096] mt-0.5">Patokan: {homeAddress.notes}</p>}
                    </div>
                    <button type="button" onClick={() => onNavigate && onNavigate("profile", { editAddress: true })}
                      className="text-[11px] font-bold text-[#2F7D5B] hover:underline shrink-0">
                      Ubah
                    </button>
                  </div>
                  <GoogleMap query={addressMapQuery(homeAddress)} height={220} title="Alamat pengiriman" />
                </>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-800">Alamat rumah belum lengkap</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 mb-3">
                    Untuk Delivery, barang dikirim ke alamat rumah di profilmu. Lengkapi alamat terlebih dahulu.
                  </p>
                  <button type="button" onClick={() => onNavigate && onNavigate("profile", { editAddress: true })}
                    className="px-4 py-2 rounded-lg bg-[#2F7D5B] hover:bg-[#25664a] text-white text-[11px] font-bold">
                    Lengkapi Alamat di Profil →
                  </button>
                </div>
              )}
              {errors.address && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.address}</p>}
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor="meeting-time" className="text-xs font-bold text-[#1F2A24] block mb-1.5">
                {deliveryMethod === "COD" ? "Tanggal & waktu pertemuan" : "Jadwal pengiriman yang diinginkan"} <span className="text-red-500">*</span>
              </label>
              <input
                id="meeting-time"
                type="datetime-local"
                value={meetingTime}
                min={minMeetingTime}
                onChange={(e) => {
                  setMeetingTime(e.target.value);
                  setErrors((er) => ({ ...er, meetingTime: "" }));
                }}
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
              />
              {meetingTime && !errors.meetingTime && (
                <p className="text-[11px] text-[#2F7D5B] font-semibold mt-1">{fmtDateTime(meetingTime)}</p>
              )}
              {errors.meetingTime && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.meetingTime}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
                Catatan untuk penjual
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={deliveryMethod === "COD" ? "Contoh: Saya memakai jaket hijau" : "Contoh: Titipkan ke satpam bila tidak ada orang"}
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
              />
            </div>
          </div>
        </div>

        {/* 3. Ringkasan Pembayaran Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 mb-8 shadow-xs">
          <h2 className="text-base font-bold text-[#1F2A24] mb-4">
            Ringkasan pembayaran
          </h2>

          <div className="space-y-2.5 text-xs sm:text-[13px] text-[#516057] pb-3 border-b border-gray-100">
            <div className="flex justify-between">
              <span>Harga barang</span>
              <span className="font-medium text-[#1F2A24]">{fmtRp(rawPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya layanan</span>
              <span className="font-medium text-[#1F2A24]">{fmtRp(serviceFee)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 text-sm sm:text-base font-bold text-[#1F2A24]">
            <span>{isCOD ? "Total dibayar saat COD" : "Total"}</span>
            <span className="text-lg font-extrabold text-[#1F2A24]">
              Rp{totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-4 mb-5">
            <label className="text-xs font-bold text-[#1F2A24] block mb-1.5">
              Metode pembayaran
            </label>
            <div className="relative">
              <select
                value={effectivePaymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isCOD}
                aria-describedby={isCOD ? "cod-payment-hint" : undefined}
                className="w-full h-[46px] px-3.5 pr-10 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] font-medium appearance-none focus:outline-none focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20 cursor-pointer disabled:cursor-not-allowed disabled:bg-[#F1F5F2] disabled:text-[#516057]"
              >
                {isCOD ? (
                  <option value={COD_PAYMENT}>COD — Bayar di tempat saat bertemu</option>
                ) : (
                  <>
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                    <option value="QRIS">QRIS (Gopay / OVO / ShopeePay)</option>
                  </>
                )}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {isCOD && (
            <p id="cod-payment-hint" className="-mt-3 mb-5 text-[11px] text-[#718096]">
              Metode pembayaran otomatis COD karena serah terima dilakukan langsung. Pilih Delivery untuk membayar via transfer / QRIS.
            </p>
          )}

          {/* Escrow Trust Notice */}
          <div className="w-full rounded-xl p-3.5 bg-[#EBF5EF] border border-[#D2E7DA] flex items-center gap-2.5 text-xs text-[#2F7D5B] mb-5">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <span className="font-bold block text-[#1F2A24]">
                {isCOD ? "Bayar setelah cek barang" : "Dana ditahan dengan aman"}
              </span>
              <span className="text-[11px] text-[#516057]">
                {isCOD
                  ? `Siapkan ${fmtRp(totalPrice)} saat bertemu. Periksa kondisi barang dulu sebelum membayar ke penjual.`
                  : "Penjual menerima dana setelah barang kamu konfirmasi diterima."}
              </span>
            </div>
          </div>

          {/* Bayar Sekarang Button */}
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isProcessing || !!payBlocked}
            className="w-full py-4 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-[#2F7D5B]/25 hover:shadow-lg transition-all text-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>{isCOD ? "Konfirmasi Pesanan COD" : "Bayar Sekarang"}</span>
            )}
          </button>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E8EEEA] bg-white pt-8 pb-10">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold leading-none">
                  T
                </span>
              </div>
              <span className="text-[#1F2A24] text-[20px] font-extrabold tracking-tight">
                TradeMe
              </span>
              <span className="text-sm text-[#718096] hidden md:inline ml-3">
                Memberi nilai baru pada barang lama.
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("donasi")}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Donasi
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("profile")}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Profil
              </button>
              <button
                type="button"
                onClick={() => onLogout && onLogout()}
                className="hover:text-red-600 transition-colors focus:outline-none"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8A948E] pt-2 border-t border-[#F0F4F1]">
            © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
          </div>
        </div>
      </footer>
    </div>
  );
}

