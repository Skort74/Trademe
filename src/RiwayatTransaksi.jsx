// Riwayat transaksi pembeli di halaman Profil.
// Menggabungkan: negosiasi/deal yang belum dibayar + transaksi (checkout & pemenang lelang),
// lengkap dengan aksi lanjutan (bayar, buka chat, konfirmasi diterima, laporkan masalah).
import React, { useCallback, useEffect, useState } from "react";
import { getOffers, cancelDeal, acceptOffer, ACTIVE_STATUSES } from "./utils/negotiation";
import { getConversation, conversationId } from "./utils/chat";
import { transactions, disputes, STORE_EVENT } from "./utils/adminStore";
import GoogleMap from "./components/GoogleMap";

const fmtRp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const OFFER_STATUS = {
  pending: { label: "Menunggu respons penjual", tone: "warn" },
  counter_buyer: { label: "Menunggu respons penjual", tone: "warn" },
  counter_seller: { label: "Penjual mengusulkan harga", tone: "urgent" },
  accepted: { label: "Deal · belum dibayar", tone: "urgent" },
};

const TX_TONE = {
  "Menunggu Pembayaran": "urgent",
  "Menunggu COD": "warn",
  Dibayar: "info",
  Dikirim: "info",
  Selesai: "done",
  Dibatalkan: "bad",
  "Dana Dikembalikan": "bad",
};

const CONFIRM_TEXT = {
  cancelDeal: {
    title: "Batalkan deal ini?",
    message: (row) => `Harga deal ${fmtRp(row.offer.price)} untuk "${row.title}" akan dibatalkan. Kamu bisa menawar lagi nanti.`,
    button: "Ya, Batalkan",
  },
  received: {
    title: "Barang sudah diterima?",
    message: (row) => `Dana untuk "${row.title}" akan diteruskan ke penjual. Pastikan barang sudah kamu terima dan sesuai.`,
    button: "Ya, Sudah Diterima",
  },
  codDone: {
    title: "COD sudah selesai?",
    message: (row) => `Konfirmasi bahwa kamu sudah bertemu penjual, menerima "${row.title}", dan membayar ${fmtRp(row.amount)}.`,
    button: "Ya, Sudah Selesai",
  },
  cancelCod: {
    title: "Batalkan pesanan COD?",
    message: (row) => `Pesanan COD "${row.title}" akan dibatalkan. Kabari penjual lewat chat bila perlu.`,
    button: "Ya, Batalkan",
  },
};

/** Kumpulkan baris riwayat milik pembeli, terbaru dulu */
function buildRows(user) {
  if (!user) return [];
  const rows = [];

  getOffers()
    .filter((o) => o.buyerId === user.username && ACTIVE_STATUSES.includes(o.status))
    .forEach((o) => {
      const conv = getConversation(conversationId(o.itemId, o.buyerId));
      const product = conv?.product || { id: o.itemId, title: o.itemTitle, category: "Jual" };
      rows.push({
        key: `offer-${o.id}`,
        kind: "offer",
        offer: o,
        product,
        title: o.itemTitle || product.title,
        type: "Negosiasi",
        amount: o.price,
        status: OFFER_STATUS[o.status],
        time: o.updatedAt,
      });
    });

  const allDisputes = disputes.all();
  transactions
    .all()
    .filter((t) => t.buyerId === user.username)
    .forEach((t) => {
      const openDispute = allDisputes.find((d) => d.transactionId === t.id && d.status !== "Selesai");
      rows.push({
        key: `tx-${t.id}`,
        kind: "tx",
        tx: t,
        openDispute,
        title: t.itemTitle,
        type: t.category === "Lelang" ? "Lelang" : t.source === "Harga hasil negosiasi" ? "Pembelian (nego)" : "Pembelian",
        amount: t.total || t.amount,
        status: openDispute
          ? { label: `Dalam sengketa (${openDispute.status})`, tone: "warn" }
          : { label: t.status, tone: TX_TONE[t.status] || "info" },
        time: t.updatedAt || t.createdAt,
      });
    });

  return rows.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function useRows(user) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener(STORE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const iv = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener(STORE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(iv);
    };
  }, [refresh]);
  return [buildRows(user), refresh];
}

export default function RiwayatTransaksi({ currentUser, onNavigate }) {
  const [rows, refresh] = useRows(currentUser);
  const [detail, setDetail] = useState(null);     // row
  const [confirm, setConfirm] = useState(null);   // { type: "cancelDeal" | "received", row }
  const [report, setReport] = useState(null);     // row
  const [reportReason, setReportReason] = useState("");
  const [notice, setNotice] = useState("");

  const pendingPayments = rows.filter(
    (r) => (r.kind === "offer" && r.offer.status === "accepted") || (r.kind === "tx" && r.tx.status === "Menunggu Pembayaran")
  );

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  };

  // ── Aksi ────────────────────────────────────────────────────────────────
  const payDeal = (row) =>
    onNavigate?.("checkout", {
      product: {
        ...row.product,
        title: row.title,
        price: row.offer.price,
        priceText: fmtRp(row.offer.price),
        dealPrice: row.offer.price,
        offerId: row.offer.id,
      },
    });

  const acceptAndPay = (row) => {
    const accepted = acceptOffer(row.offer.id, "buyer");
    if (accepted) payDeal({ ...row, offer: accepted });
  };

  const payTransaction = (tx) =>
    onNavigate?.("checkout", {
      product: {
        id: tx.itemId,
        title: tx.itemTitle,
        image: tx.itemImage,
        category: tx.category,
        seller: tx.sellerName,
        price: tx.amount,
        priceText: fmtRp(tx.amount),
        transactionId: tx.id,
      },
    });

  const openChat = (row) =>
    onNavigate?.("chat", {
      product: row.product,
      conversationId: conversationId(row.offer.itemId, row.offer.buyerId),
    });

  const runConfirm = () => {
    const { type, row } = confirm;
    if (type === "cancelDeal") {
      cancelDeal(row.offer.id, "buyer");
      flash(`Negosiasi "${row.title}" dibatalkan.`);
    } else if (type === "received") {
      transactions.update(row.tx.id, { status: "Selesai", receivedAt: new Date().toISOString() });
      flash(`Terima kasih! Dana untuk "${row.title}" diteruskan ke penjual.`);
    } else if (type === "codDone") {
      const now = new Date().toISOString();
      transactions.update(row.tx.id, { status: "Selesai", paidAt: now, receivedAt: now });
      flash(`Transaksi COD "${row.title}" selesai. Terima kasih!`);
    } else if (type === "cancelCod") {
      transactions.update(row.tx.id, { status: "Dibatalkan", cancelledBy: "buyer" });
      flash(`Pesanan COD "${row.title}" dibatalkan.`);
    }
    setConfirm(null);
    refresh();
  };

  const submitReport = (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    const t = report.tx;
    disputes.add({
      transactionId: t.id,
      itemTitle: t.itemTitle,
      buyerName: t.buyerName,
      sellerName: t.sellerName,
      amount: t.total || t.amount,
      reporter: "Pembeli",
      reason: reportReason.trim(),
      status: "Terbuka",
    });
    setReport(null);
    setReportReason("");
    flash("Laporan terkirim. Admin TradeMe akan meninjau dan menghubungimu.");
  };

  const renderActions = (row) => {
    if (row.kind === "offer") {
      if (row.offer.status === "accepted") {
        return (
          <>
            <button type="button" className="tp-pay-button" onClick={() => payDeal(row)}>
              Lanjutkan Pembayaran
            </button>
            <button type="button" onClick={() => openChat(row)}>Chat</button>
            <button type="button" className="tp-delete" onClick={() => setConfirm({ type: "cancelDeal", row })}>
              Batalkan
            </button>
          </>
        );
      }
      if (row.offer.status === "counter_seller") {
        // Setujui harga usulan penjual lalu langsung ke pembayaran
        return (
          <>
            <button type="button" className="tp-pay-button" onClick={() => acceptAndPay(row)}>
              Setuju &amp; Bayar {fmtRp(row.offer.price)}
            </button>
            <button type="button" onClick={() => openChat(row)}>Tawar Lagi</button>
          </>
        );
      }
      // Masih menunggu penjual: belum ada harga yang disepakati
      return <button type="button" onClick={() => openChat(row)}>Lihat Chat</button>;
    }

    const { tx, openDispute } = row;
    return (
      <>
        {tx.status === "Menunggu Pembayaran" && (
          <button type="button" className="tp-pay-button" onClick={() => payTransaction(tx)}>
            Lanjutkan Pembayaran
          </button>
        )}
        {tx.status === "Menunggu COD" && (
          <button type="button" className="tp-pay-button" onClick={() => setConfirm({ type: "codDone", row })}>
            Sudah Bertemu &amp; Bayar
          </button>
        )}
        {tx.status === "Dikirim" && !openDispute && (
          <button type="button" className="tp-pay-button" onClick={() => setConfirm({ type: "received", row })}>
            Barang Diterima
          </button>
        )}
        <button type="button" onClick={() => setDetail(row)}>Detail</button>
        {tx.status === "Menunggu COD" && (
          <button type="button" className="tp-delete" onClick={() => setConfirm({ type: "cancelCod", row })}>
            Batalkan
          </button>
        )}
        {["Dibayar", "Dikirim"].includes(tx.status) && !openDispute && (
          <button type="button" className="tp-delete" onClick={() => { setReport(row); setReportReason(""); }}>
            Laporkan
          </button>
        )}
      </>
    );
  };

  return (
    <section className="tp-section-card">
      <div className="tp-section-heading">
        <div>
          <p className="tp-kicker">AKTIVITAS TERBARU</p>
          <h2>Riwayat Transaksi</h2>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="tp-pending-banner">
          <strong>⏳ {pendingPayments.length} pembayaran belum diselesaikan.</strong>{" "}
          Tekan “Lanjutkan Pembayaran” pada baris di bawah untuk menyelesaikannya.
        </div>
      )}
      {notice && <div className="tp-success" role="status">{notice}</div>}

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
            {rows.map((row) => (
              <tr key={row.key} className={row.status.tone === "urgent" ? "tp-row-urgent" : ""}>
                <td className="tp-item-name">
                  {row.title}
                  <span className="tp-row-sub">{fmtRp(row.amount)} · {fmtDate(row.time)}</span>
                </td>
                <td>{row.type}</td>
                <td><span className={`tp-status tp-status-${row.status.tone}`}>{row.status.label}</span></td>
                <td><div className="tp-row-actions tp-row-actions-wrap">{renderActions(row)}</div></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="tp-empty" colSpan="4">
                  Belum ada transaksi. Negosiasi dan pembelianmu akan muncul di sini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal detail transaksi ── */}
      {detail && (
        <div className="tp-modal-backdrop" role="presentation" onMouseDown={() => setDetail(null)}>
          <section className="tp-modal tp-modal-wide" role="dialog" aria-modal="true" aria-labelledby="tx-detail-title"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="tp-modal-heading">
              <div>
                <p className="tp-kicker">DETAIL TRANSAKSI</p>
                <h2 id="tx-detail-title">{detail.title}</h2>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setDetail(null)}>×</button>
            </div>
            <dl className="tp-detail-list">
              {[
                ["Status", detail.status.label],
                ["Penjual", detail.tx.sellerName],
                ["Harga barang", fmtRp(detail.tx.amount)],
                ["Biaya layanan", fmtRp(detail.tx.serviceFee)],
                ["Total", fmtRp(detail.tx.total || detail.tx.amount)],
                ["Pembayaran", detail.tx.paymentMethod],
                ["Serah terima", detail.tx.deliveryMethod],
                detail.tx.meetingLocation && ["Lokasi COD", detail.tx.meetingLocation.label],
                detail.tx.deliveryAddress && ["Alamat kirim", detail.tx.deliveryAddress],
                detail.tx.meetingTime && [detail.tx.deliveryMethod === "Delivery" ? "Jadwal kirim" : "Waktu temu", fmtDate(detail.tx.meetingTime)],
                detail.tx.notes && ["Catatan", detail.tx.notes],
                ["Dibuat", fmtDate(detail.tx.createdAt)],
                ["ID", detail.tx.id],
              ]
                .filter(Boolean)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "-"}</dd>
                  </div>
                ))}
            </dl>
            {(detail.tx.meetingLocation?.query || detail.tx.deliveryAddress) && (
              <GoogleMap query={detail.tx.meetingLocation?.query || detail.tx.deliveryAddress} height={200} title="Lokasi serah terima" />
            )}
          </section>
        </div>
      )}

      {/* ── Modal konfirmasi ── */}
      {confirm && (
        <div className="tp-modal-backdrop" role="presentation" onMouseDown={() => setConfirm(null)}>
          <section className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tx-confirm-title"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="tp-modal-heading">
              <div>
                <p className="tp-kicker">KONFIRMASI</p>
                <h2 id="tx-confirm-title">
                  {CONFIRM_TEXT[confirm.type].title}
                </h2>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setConfirm(null)}>×</button>
            </div>
            <p className="tp-confirm-text">
              {CONFIRM_TEXT[confirm.type].message(confirm.row)}
            </p>
            <div className="tp-modal-actions">
              <button className="tp-cancel" type="button" onClick={() => setConfirm(null)}>Kembali</button>
              <button className="tp-save" type="button" onClick={runConfirm}>
                {CONFIRM_TEXT[confirm.type].button}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── Modal laporkan masalah ── */}
      {report && (
        <div className="tp-modal-backdrop" role="presentation" onMouseDown={() => setReport(null)}>
          <section className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tx-report-title"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="tp-modal-heading">
              <div>
                <p className="tp-kicker">LAPORKAN MASALAH</p>
                <h2 id="tx-report-title">{report.title}</h2>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setReport(null)}>×</button>
            </div>
            <form onSubmit={submitReport}>
              <label>
                Ceritakan masalahnya
                <textarea
                  className="tp-textarea"
                  rows="4"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Contoh: Barang yang diterima tidak sesuai foto, ada retak di bagian kaki."
                />
              </label>
              <p className="tp-confirm-text">Dana tetap ditahan selama admin meninjau laporanmu.</p>
              <div className="tp-modal-actions">
                <button className="tp-cancel" type="button" onClick={() => setReport(null)}>Batal</button>
                <button className="tp-save" type="submit" disabled={!reportReason.trim()}>Kirim Laporan</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
