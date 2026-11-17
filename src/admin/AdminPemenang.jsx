import React, { useState } from "react";
import { auctionBids, auctionResults, transactions } from "../utils/adminStore";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, useStoreData, fmtRp, fmtDate, initials, matches,
} from "./AdminUI";

/** Kelompokkan penawaran per barang lelang */
function groupAuctions(bids, results) {
  const map = new Map();
  bids.forEach((b) => {
    const key = String(b.itemId);
    if (!map.has(key)) map.set(key, { itemId: b.itemId, itemTitle: b.itemTitle, itemImage: b.itemImage, sellerName: b.sellerName, bids: [] });
    map.get(key).bids.push(b);
  });
  return Array.from(map.values()).map((a) => {
    const sorted = [...a.bids].sort((x, y) => y.amount - x.amount || new Date(x.createdAt) - new Date(y.createdAt));
    const result = results.find((r) => String(r.itemId) === String(a.itemId)) || null;
    return {
      ...a,
      bids: sorted,
      top: sorted[0],
      bidders: new Set(sorted.map((b) => b.bidderId)).size,
      lastBidAt: a.bids.reduce((m, b) => (b.createdAt > m ? b.createdAt : m), ""),
      result,
      status: result ? result.status : "Berlangsung",
    };
  });
}

export default function AdminPemenang({ notify, onGoTab }) {
  const [bids] = useStoreData(auctionBids.all);
  const [results] = useStoreData(auctionResults.all);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Berlangsung");
  const [selectedKey, setSelectedKey] = useState(null);
  const [pickedBidId, setPickedBidId] = useState(null);
  const [confirm, setConfirm] = useState(null); // "win" | "close" | "undo"

  const auctions = groupAuctions(bids, results).sort((a, b) => (b.lastBidAt > a.lastBidAt ? 1 : -1));
  const filtered = auctions.filter((a) => matches(q, a.itemTitle) && (status === "Semua" || a.status === status));
  const sel = auctions.find((a) => String(a.itemId) === selectedKey) || null;
  const picked = sel ? sel.bids.find((b) => b.id === pickedBidId) || sel.top : null;
  const resultTx = sel?.result?.transactionId ? transactions.all().find((t) => t.id === sel.result.transactionId) : null;

  const select = (a) => {
    setSelectedKey(String(a.itemId));
    setPickedBidId(null);
  };

  const run = () => {
    if (confirm === "win") {
      const tx = transactions.add({
        itemId: sel.itemId,
        itemTitle: sel.itemTitle,
        itemImage: sel.itemImage,
        category: "Lelang",
        buyerId: picked.bidderId,
        buyerName: picked.bidderName,
        sellerName: sel.sellerName || "-",
        amount: picked.amount,
        serviceFee: 0,
        total: picked.amount,
        paymentMethod: "-",
        deliveryMethod: "-",
        status: "Menunggu Pembayaran",
        source: "Pemenang lelang",
      });
      auctionResults.add({
        itemId: sel.itemId,
        itemTitle: sel.itemTitle,
        winnerId: picked.bidderId,
        winnerName: picked.bidderName,
        amount: picked.amount,
        bidId: picked.id,
        transactionId: tx.id,
        status: "Pemenang Ditetapkan",
      });
      notify("setujui", `${picked.bidderName} ditetapkan sebagai pemenang "${sel.itemTitle}" (${fmtRp(picked.amount)}).`);
    } else if (confirm === "close") {
      auctionResults.add({ itemId: sel.itemId, itemTitle: sel.itemTitle, status: "Ditutup Tanpa Pemenang" });
      notify("tolak", `Lelang "${sel.itemTitle}" ditutup tanpa pemenang.`);
    } else if (confirm === "undo") {
      if (resultTx && resultTx.status === "Menunggu Pembayaran") {
        transactions.update(resultTx.id, { status: "Dibatalkan" });
      }
      auctionResults.remove(sel.result.id);
      notify("update", `Penetapan lelang "${sel.itemTitle}" dibatalkan.`);
    }
    setConfirm(null);
  };

  // Penetapan hanya bisa dibatalkan selama pemenang belum membayar
  const canUndo = sel?.result && (!resultTx || resultTx.status === "Menunggu Pembayaran" || resultTx.status === "Dibatalkan");

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Tentukan Pemenang Lelang" subtitle={`${auctions.filter((a) => a.status === "Berlangsung").length} lelang belum ditetapkan pemenangnya.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari barang ..." />
            <SelectFilter value={status} onChange={setStatus} placeholder="Semua status" options={["Berlangsung", "Pemenang Ditetapkan", "Ditutup Tanpa Pemenang"]} />
          </CardHeader>
          <Table
            columns={["Barang", "Jumlah Tawaran", "Tawaran Tertinggi", "Penawar Tertinggi", "Status"]}
            empty="Belum ada lelang dengan tawaran. Lelang muncul di sini setelah pengguna mengajukan tawaran."
          >
            {filtered.map((a) => (
              <Row key={a.itemId} selected={selectedKey === String(a.itemId)} onClick={() => select(a)}>
                <Cell bold>{a.itemTitle}</Cell>
                <Cell>{a.bids.length} tawaran · {a.bidders} penawar</Cell>
                <Cell bold>{fmtRp(a.top?.amount)}</Cell>
                <Cell>{a.top?.bidderName}</Cell>
                <Cell><Badge>{a.status}</Badge></Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Lelang">
          {sel && (
            <>
              {sel.itemImage && (
                <div className="w-full h-[120px] rounded-[11px] overflow-hidden bg-gray-100 border border-[#E8EDE9] mb-3">
                  <img src={sel.itemImage} alt={sel.itemTitle} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-[16px] font-bold text-[#1F2A24]">{sel.itemTitle}</h3>
              <InfoList
                rows={[
                  ["Status", <Badge>{sel.status}</Badge>],
                  ["Total tawaran", `${sel.bids.length} dari ${sel.bidders} penawar`],
                  ["Tawaran terakhir", fmtDate(sel.lastBidAt)],
                  sel.result?.winnerName && ["Pemenang", sel.result.winnerName],
                  sel.result?.amount && ["Harga menang", fmtRp(sel.result.amount)],
                  resultTx && ["Pembayaran", <Badge>{resultTx.status}</Badge>],
                ]}
              />

              <p className="text-[10px] font-bold text-[#56635B] mb-1.5">
                Riwayat tawaran {!sel.result && <span className="font-normal">(klik untuk memilih pemenang)</span>}
              </p>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 mb-3 pr-1">
                {sel.bids.map((b, idx) => {
                  const isWinner = sel.result?.bidId === b.id;
                  const isPicked = !sel.result && picked?.id === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      disabled={!!sel.result}
                      onClick={() => setPickedBidId(b.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors ${
                        isWinner || isPicked ? "border-[#2F7D5B] bg-[#E5F2EB]" : "border-[#E8EDE9] bg-white hover:bg-[#F8FAF9]"
                      } ${sel.result ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#DCECE3] text-[#1F6044] text-[8px] font-extrabold flex items-center justify-center shrink-0">
                          {initials(b.bidderName)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#1F2A24] truncate">
                            {b.bidderName} {idx === 0 && <span className="text-[9px] text-[#2F7D5B]">· tertinggi</span>}
                            {isWinner && <span className="text-[9px] text-[#2F7D5B]"> · 🏆 pemenang</span>}
                          </p>
                          <p className="text-[9px] text-[#66736C]">{fmtDate(b.createdAt)}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#1F2A24] shrink-0">{fmtRp(b.amount)}</span>
                    </button>
                  );
                })}
              </div>

              {!sel.result ? (
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => setConfirm("win")}>
                    🏆 Tetapkan {picked?.bidderName} sebagai Pemenang
                  </Button>
                  <Button variant="outline" onClick={() => setConfirm("close")}>Tutup Tanpa Pemenang</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {resultTx && (
                    <Button variant="link" onClick={() => onGoTab("transaksi")}>Lihat Transaksi →</Button>
                  )}
                  {canUndo && (
                    <Button variant="danger" onClick={() => setConfirm("undo")}>Batalkan Penetapan</Button>
                  )}
                </div>
              )}
            </>
          )}
          <ConfirmModal
            open={!!confirm}
            title={
              confirm === "win" ? "Tetapkan Pemenang?" : confirm === "close" ? "Tutup Lelang?" : "Batalkan Penetapan?"
            }
            message={
              !sel
                ? ""
                : confirm === "win"
                ? `${picked?.bidderName} memenangkan "${sel.itemTitle}" seharga ${fmtRp(picked?.amount)}. Transaksi baru dibuat dengan status "Menunggu Pembayaran".`
                : confirm === "close"
                ? `Lelang "${sel.itemTitle}" akan ditutup tanpa pemenang.`
                : `Hasil lelang dihapus dan transaksi yang belum dibayar akan dibatalkan.`
            }
            danger={confirm !== "win"}
            onCancel={() => setConfirm(null)}
            onConfirm={run}
          />
        </DetailPanel>
      }
    />
  );
}
