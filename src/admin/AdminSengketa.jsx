import React, { useState, useEffect } from "react";
import { disputes, transactions } from "../utils/adminStore";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, textareaCls, useStoreData, fmtRp, fmtDate, matches,
} from "./AdminUI";

// Keputusan penyelesaian sengketa & efeknya ke transaksi
const RESOLUTIONS = {
  refund: {
    label: "Kembalikan Dana ke Pembeli",
    resolution: "Dana dikembalikan ke pembeli",
    txStatus: "Dana Dikembalikan",
    variant: "danger",
  },
  release: {
    label: "Teruskan Dana ke Penjual",
    resolution: "Dana diteruskan ke penjual",
    txStatus: "Selesai",
    variant: "approve",
  },
  dismiss: {
    label: "Tolak Laporan",
    resolution: "Laporan ditolak, transaksi dilanjutkan",
    txStatus: null,
    variant: "outline",
  },
};

export default function AdminSengketa({ notify, onGoTab }) {
  const [list] = useStoreData(disputes.all);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null); // key of RESOLUTIONS

  const filtered = list.filter(
    (d) => matches(q, d.itemTitle, d.buyerName, d.sellerName, d.reason) && (status === "Semua" || d.status === status)
  );
  const sel = list.find((d) => d.id === selectedId) || null;
  const tx = sel ? transactions.all().find((t) => t.id === sel.transactionId) : null;
  const openCount = list.filter((d) => d.status !== "Selesai").length;

  useEffect(() => {
    setNote(sel?.adminNote || "");
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startReview = () => {
    disputes.update(sel.id, { status: "Ditinjau", adminNote: note });
    notify("update", `Sengketa "${sel.itemTitle}" sedang ditinjau.`);
  };

  const saveNote = () => {
    disputes.update(sel.id, { adminNote: note });
    notify("update", "Catatan admin disimpan.");
  };

  const resolve = () => {
    const r = RESOLUTIONS[confirm];
    disputes.update(sel.id, {
      status: "Selesai",
      resolution: r.resolution,
      adminNote: note,
      resolvedAt: new Date().toISOString(),
    });
    if (r.txStatus && tx) transactions.update(tx.id, { status: r.txStatus });
    notify(confirm === "refund" ? "tolak" : "setujui", `Sengketa "${sel.itemTitle}" selesai: ${r.resolution}.`);
    setConfirm(null);
  };

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Daftar Sengketa" subtitle={`${openCount} sengketa belum selesai.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari barang / nama ..." />
            <SelectFilter value={status} onChange={setStatus} placeholder="Status" options={["Terbuka", "Ditinjau", "Selesai"]} />
          </CardHeader>
          <Table
            columns={["Barang", "Pelapor", "Pembeli / Penjual", "Nilai", "Status", "Dibuka"]}
            empty={
              <>
                <p className="mb-2">Belum ada sengketa.</p>
                <button type="button" onClick={() => onGoTab("transaksi")} className="text-[#2F7D5B] font-bold underline cursor-pointer">
                  Sengketa dibuka dari tab Transaksi →
                </button>
              </>
            }
          >
            {filtered.map((d) => (
              <Row key={d.id} selected={selectedId === d.id} onClick={() => setSelectedId(d.id)}>
                <Cell bold>{d.itemTitle}</Cell>
                <Cell>{d.reporter}</Cell>
                <Cell>{d.buyerName} / {d.sellerName}</Cell>
                <Cell bold>{fmtRp(d.amount)}</Cell>
                <Cell><Badge>{d.status}</Badge></Cell>
                <Cell>{fmtDate(d.createdAt, false)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Sengketa">
          {sel && (
            <>
              <h3 className="text-[16px] font-bold text-[#1F2A24]">{sel.itemTitle}</h3>
              <p className="text-[10px] text-[#66736C]">Dilaporkan oleh {sel.reporter} · {fmtDate(sel.createdAt)}</p>

              <div className="mt-3 p-3 rounded-xl bg-[#F8FAF9] border border-[#E8EDE9]">
                <p className="text-[10px] font-bold text-[#56635B] mb-1">Alasan laporan</p>
                <p className="text-[11px] text-[#1F2A24] whitespace-pre-wrap">{sel.reason}</p>
              </div>

              <InfoList
                rows={[
                  ["Status", <Badge>{sel.status}</Badge>],
                  ["Pembeli", sel.buyerName],
                  ["Penjual", sel.sellerName],
                  ["Nilai transaksi", fmtRp(sel.amount)],
                  ["Status transaksi", tx ? <Badge>{tx.status}</Badge> : "Transaksi tidak ditemukan"],
                  sel.resolution && ["Keputusan", sel.resolution],
                  sel.resolvedAt && ["Diselesaikan", fmtDate(sel.resolvedAt)],
                ]}
              />

              <div className="flex items-center justify-between mb-1">
                <label htmlFor="catatan-sengketa" className="text-[#56635B] text-[10px] font-bold">Catatan admin</label>
                {sel.status !== "Selesai" && (
                  <button type="button" onClick={saveNote} className="text-[9px] font-bold text-[#2F7D5B] hover:underline cursor-pointer">
                    Simpan Catatan
                  </button>
                )}
              </div>
              <textarea id="catatan-sengketa" rows="3" value={note} onChange={(e) => setNote(e.target.value)}
                disabled={sel.status === "Selesai"} placeholder="Hasil investigasi, bukti yang diterima, dsb."
                className={`${textareaCls} disabled:bg-[#F8FAF9]`} />

              {sel.status === "Terbuka" && (
                <Button variant="primary" className="w-full mt-3" onClick={startReview}>Mulai Tinjau</Button>
              )}
              {sel.status !== "Selesai" && (
                <div className="flex flex-col gap-2 mt-2">
                  {Object.entries(RESOLUTIONS).map(([key, r]) => (
                    <Button key={key} variant={r.variant} onClick={() => setConfirm(key)}>{r.label}</Button>
                  ))}
                </div>
              )}
            </>
          )}
          <ConfirmModal
            open={!!confirm}
            title={confirm ? `${RESOLUTIONS[confirm].label}?` : ""}
            message={
              confirm
                ? `Sengketa akan ditutup dengan keputusan: "${RESOLUTIONS[confirm].resolution}".` +
                  (RESOLUTIONS[confirm].txStatus ? ` Status transaksi menjadi "${RESOLUTIONS[confirm].txStatus}".` : "")
                : ""
            }
            danger={confirm === "refund"}
            onCancel={() => setConfirm(null)}
            onConfirm={resolve}
          />
        </DetailPanel>
      }
    />
  );
}
