import React from "react";
import { getRegisteredUsers } from "../utils/auth";
import { getOffers } from "../utils/negotiation";
import { transactions, disputes, recipientApplications, auctionBids, auctionResults, foundations } from "../utils/adminStore";
import { Card, CardHeader, StatCard, Table, Row, Cell, Badge, Button, useStoreData, fmtRp, fmtDate } from "./AdminUI";

function readAll() {
  return {
    users: getRegisteredUsers(),
    txs: transactions.all(),
    disputes: disputes.all(),
    apps: recipientApplications.all(),
    bids: auctionBids.all(),
    results: auctionResults.all(),
    foundations: foundations.all(),
    offers: getOffers(),
  };
}

export default function AdminRingkasan({ items, onGoTab }) {
  const [d] = useStoreData(readAll);

  const kurasiPending = items.filter((i) => ["Menunggu", "Ditinjau", "Dilaporkan"].includes(i.kurasi)).length;
  const reported = items.filter((i) => i.kurasi === "Dilaporkan").length;
  const lelangPending = items.filter((i) => i.jenis === "Lelang" && (i.lelang?.verif || "Menunggu Verifikasi") === "Menunggu Verifikasi").length;
  const txActive = d.txs.filter((t) => ["Menunggu Pembayaran", "Menunggu COD", "Dibayar", "Dikirim"].includes(t.status));
  const txDone = d.txs.filter((t) => t.status === "Selesai");
  const gmv = txDone.reduce((s, t) => s + Number(t.total || t.amount || 0), 0);
  const disputesOpen = d.disputes.filter((x) => x.status !== "Selesai").length;
  const appsPending = d.apps.filter((a) => a.status === "Menunggu").length;
  const decidedIds = new Set(d.results.map((r) => String(r.itemId)));
  const auctionsUndecided = new Set(d.bids.filter((b) => !decidedIds.has(String(b.itemId))).map((b) => String(b.itemId))).size;
  const activeNego = d.offers.filter((o) => ["pending", "counter_buyer", "counter_seller"].includes(o.status)).length;
  const usersInactive = d.users.filter((u) => u.status === "Nonaktif").length;

  const todos = [
    kurasiPending && { tab: "barang", text: `${kurasiPending} barang perlu dikurasi`, extra: reported ? `${reported} dilaporkan` : null },
    disputesOpen && { tab: "sengketa", text: `${disputesOpen} sengketa belum selesai`, urgent: true },
    appsPending && { tab: "verif-penerima", text: `${appsPending} pengajuan penerima menunggu verifikasi` },
    lelangPending && { tab: "verif-lelang", text: `${lelangPending} barang lelang menunggu verifikasi` },
    auctionsUndecided && { tab: "tentukan-pemenang", text: `${auctionsUndecided} lelang belum ditetapkan pemenangnya` },
    d.txs.filter((t) => t.status === "Dibayar").length && {
      tab: "transaksi",
      text: `${d.txs.filter((t) => t.status === "Dibayar").length} transaksi dibayar, menunggu pengiriman`,
    },
  ].filter(Boolean);

  const recentTx = d.txs.slice(0, 5);

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pengguna" value={d.users.length} hint={usersInactive ? `${usersInactive} nonaktif` : "Semua aktif"} onClick={() => onGoTab("pengguna")} />
        <StatCard label="Barang" value={items.length} hint={`${kurasiPending} perlu kurasi`} onClick={() => onGoTab("barang")} />
        <StatCard label="Transaksi Aktif" value={txActive.length} hint={`${d.txs.length} total transaksi`} onClick={() => onGoTab("transaksi")} />
        <StatCard label="Nilai Transaksi Selesai" value={fmtRp(gmv)} hint={`${txDone.length} transaksi selesai`} onClick={() => onGoTab("transaksi")} />
        <StatCard label="Sengketa Terbuka" value={disputesOpen} hint={`${d.disputes.length} total sengketa`} onClick={() => onGoTab("sengketa")} />
        <StatCard label="Yayasan Aktif" value={d.foundations.filter((y) => y.status === "Aktif").length} hint={`${appsPending} pengajuan baru`} onClick={() => onGoTab("yayasan")} />
        <StatCard label="Lelang Berjalan" value={auctionsUndecided} hint={`${d.bids.length} tawaran masuk`} onClick={() => onGoTab("tentukan-pemenang")} />
        <StatCard label="Negosiasi Aktif" value={activeNego} hint="Penawaran harga barang jual" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5 items-start">
        <Card>
          <CardHeader title="Perlu Tindakan" subtitle="Antrean pekerjaan admin saat ini." />
          {todos.length === 0 ? (
            <p className="text-xs text-[#66736C] text-center py-8">✓ Semua beres, tidak ada antrean.</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((t) => (
                <li key={t.tab}>
                  <button
                    type="button"
                    onClick={() => onGoTab(t.tab)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      t.urgent ? "border-[#EFC8CB] bg-[#FAE8E8] hover:bg-[#f6dbdb]" : "border-[#E8EDE9] bg-[#F8FAF9] hover:bg-[#F1F7F3]"
                    }`}
                  >
                    <div>
                      <p className={`text-[11px] font-bold ${t.urgent ? "text-[#A83F49]" : "text-[#1F2A24]"}`}>{t.text}</p>
                      {t.extra && <p className="text-[10px] text-[#66736C]">{t.extra}</p>}
                    </div>
                    <span className="text-[#2F7D5B] text-xs font-bold">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Transaksi Terbaru" subtitle="5 transaksi paling baru.">
            <Button variant="link" onClick={() => onGoTab("transaksi")}>Lihat semua →</Button>
          </CardHeader>
          <Table columns={["Barang", "Pembeli", "Total", "Status", "Tanggal"]} empty="Belum ada transaksi.">
            {recentTx.map((t) => (
              <Row key={t.id} onClick={() => onGoTab("transaksi")}>
                <Cell bold>{t.itemTitle}</Cell>
                <Cell>{t.buyerName}</Cell>
                <Cell bold>{fmtRp(t.total || t.amount)}</Cell>
                <Cell><Badge>{t.status}</Badge></Cell>
                <Cell>{fmtDate(t.createdAt, false)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
