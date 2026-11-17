import React, { useState } from "react";
import { transactions, disputes } from "../utils/adminStore";
import GoogleMap from "../components/GoogleMap";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, Modal, Field, textareaCls, useStoreData, fmtRp, fmtDate, matches,
} from "./AdminUI";

export const TX_STATUSES = ["Menunggu Pembayaran", "Menunggu COD", "Dibayar", "Dikirim", "Selesai", "Dibatalkan", "Dana Dikembalikan"];

// Langkah berikutnya per status
const NEXT_STEP = {
  "Menunggu Pembayaran": { to: "Dibayar", label: "Konfirmasi Pembayaran" },
  // COD: pembeli membayar langsung ke penjual saat bertemu
  "Menunggu COD": { to: "Selesai", label: "Tandai COD Selesai (sudah bertemu & dibayar)" },
  Dibayar: { to: "Dikirim", label: "Tandai Dikirim / Diserahkan" },
  Dikirim: { to: "Selesai", label: "Selesaikan & Teruskan Dana" },
};

export default function AdminTransaksi({ notify, onGoTab }) {
  const [list] = useStoreData(transactions.all);
  const [allDisputes] = useStoreData(disputes.all);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { to, label }
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeReporter, setDisputeReporter] = useState("Pembeli");

  const filtered = list.filter(
    (t) => matches(q, t.id, t.itemTitle, t.buyerName, t.sellerName) && (status === "Semua" || t.status === status)
  );
  const sel = list.find((t) => t.id === selectedId) || null;
  const selDispute = sel ? allDisputes.find((d) => d.transactionId === sel.id && d.status !== "Selesai") : null;
  const totalSelesai = list.filter((t) => t.status === "Selesai").reduce((s, t) => s + Number(t.total || t.amount || 0), 0);

  const changeStatus = () => {
    transactions.update(sel.id, { status: confirm.to });
    notify(confirm.to === "Dibatalkan" ? "tolak" : "setujui", `Transaksi ${sel.id} → ${confirm.to}.`);
    setConfirm(null);
  };

  const openDispute = () => {
    if (!disputeReason.trim()) return;
    disputes.add({
      transactionId: sel.id,
      itemTitle: sel.itemTitle,
      buyerName: sel.buyerName,
      sellerName: sel.sellerName,
      amount: sel.total || sel.amount,
      reporter: disputeReporter,
      reason: disputeReason.trim(),
      status: "Terbuka",
    });
    setDisputeOpen(false);
    setDisputeReason("");
    notify("update", `Sengketa untuk transaksi ${sel.id} berhasil dibuka.`);
  };

  const step = sel && NEXT_STEP[sel.status];
  const canCancel = sel && ["Menunggu Pembayaran", "Menunggu COD", "Dibayar"].includes(sel.status);
  const canDispute = sel && ["Dibayar", "Dikirim"].includes(sel.status) && !selDispute;

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader
            title="Daftar Transaksi"
            subtitle={`${list.length} transaksi · total selesai ${fmtRp(totalSelesai)}`}
          >
            <SearchInput value={q} onChange={setQ} placeholder="Cari ID / barang / nama ..." />
            <SelectFilter value={status} onChange={setStatus} placeholder="Status" options={TX_STATUSES} />
          </CardHeader>
          <Table
            columns={["ID", "Barang", "Pembeli", "Total", "Status", "Tanggal"]}
            empty="Belum ada transaksi. Transaksi akan muncul setelah pengguna membayar di halaman checkout."
          >
            {filtered.map((t) => (
              <Row key={t.id} selected={selectedId === t.id} onClick={() => setSelectedId(t.id)}>
                <Cell className="font-mono text-[10px]">{t.id.split("-").slice(0, 2).join("-")}</Cell>
                <Cell bold>{t.itemTitle}</Cell>
                <Cell>{t.buyerName}</Cell>
                <Cell bold>{fmtRp(t.total || t.amount)}</Cell>
                <Cell><Badge>{t.status}</Badge></Cell>
                <Cell>{fmtDate(t.createdAt, false)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Transaksi">
          {sel && (
            <>
              {sel.itemImage && (
                <div className="w-full h-[120px] rounded-[11px] overflow-hidden bg-gray-100 border border-[#E8EDE9] mb-3">
                  <img src={sel.itemImage} alt={sel.itemTitle} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-[16px] font-bold text-[#1F2A24]">{sel.itemTitle}</h3>
              <p className="text-[10px] text-[#66736C] font-mono">{sel.id}</p>
              <InfoList
                rows={[
                  ["Status", <Badge>{sel.status}</Badge>],
                  ["Kategori", sel.category],
                  ["Pembeli", sel.buyerName],
                  ["Penjual", sel.sellerName],
                  ["Harga barang", fmtRp(sel.amount)],
                  ["Biaya layanan", fmtRp(sel.serviceFee)],
                  ["Total", fmtRp(sel.total || sel.amount)],
                  ["Pembayaran", sel.paymentMethod],
                  ["Pengiriman", sel.deliveryMethod],
                  sel.meetingTime && [sel.deliveryMethod === "Delivery" ? "Jadwal kirim" : "Waktu temu", fmtDate(sel.meetingTime)],
                  sel.meetingLocation && ["Lokasi COD", sel.meetingLocation.label],
                  sel.deliveryAddress && ["Alamat kirim", sel.deliveryAddress],
                  sel.notes && ["Catatan", sel.notes],
                  ["Dibuat", fmtDate(sel.createdAt)],
                  ["Diperbarui", fmtDate(sel.updatedAt)],
                ]}
              />

              {(sel.meetingLocation?.query || sel.deliveryAddress) && (
                <GoogleMap
                  query={sel.meetingLocation?.query || sel.deliveryAddress}
                  height={160}
                  title="Lokasi serah terima"
                  className="mb-3"
                />
              )}

              {selDispute && (
                <div className="mb-3 p-3 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[11px] text-[#92400E]">
                  <p className="font-bold">⚠ Sedang dalam sengketa ({selDispute.status})</p>
                  <p className="mt-0.5">Status transaksi dikunci sampai sengketa diselesaikan.</p>
                  <button type="button" onClick={() => onGoTab("sengketa")} className="mt-1 font-bold underline cursor-pointer">
                    Buka tab Sengketa →
                  </button>
                </div>
              )}

              {!selDispute && (
                <div className="flex flex-col gap-2">
                  {step && (
                    <Button variant="primary" onClick={() => setConfirm(step)}>{step.label}</Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {canDispute && (
                      <Button variant="outline" onClick={() => setDisputeOpen(true)}>Buka Sengketa</Button>
                    )}
                    {canCancel && (
                      <Button variant="danger" onClick={() => setConfirm({ to: "Dibatalkan", label: "Batalkan Transaksi" })}>
                        Batalkan
                      </Button>
                    )}
                  </div>
                  {!step && !canCancel && (
                    <p className="text-[10px] text-[#66736C] text-center">Transaksi ini sudah final.</p>
                  )}
                </div>
              )}
            </>
          )}

          <ConfirmModal
            open={!!confirm}
            title={confirm?.label + "?"}
            message={sel && confirm ? `Status transaksi "${sel.itemTitle}" akan diubah menjadi "${confirm.to}".` : ""}
            danger={confirm?.to === "Dibatalkan"}
            onCancel={() => setConfirm(null)}
            onConfirm={changeStatus}
          />

          <Modal
            open={disputeOpen}
            title="Buka Sengketa"
            subtitle={sel ? `Transaksi ${sel.itemTitle}` : ""}
            onClose={() => setDisputeOpen(false)}
            footer={
              <>
                <Button onClick={() => setDisputeOpen(false)}>Batal</Button>
                <Button variant="primary" disabled={!disputeReason.trim()} onClick={openDispute}>Buka Sengketa</Button>
              </>
            }
          >
            <Field label="Dilaporkan oleh">
              <div className="flex gap-2">
                {["Pembeli", "Penjual"].map((r) => (
                  <Button key={r} variant={disputeReporter === r ? "primary" : "outline"} onClick={() => setDisputeReporter(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Alasan / kronologi" required>
              <textarea rows="4" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Contoh: Barang yang diterima tidak sesuai foto, ada retak di bagian kaki."
                className={textareaCls} />
            </Field>
          </Modal>
        </DetailPanel>
      }
    />
  );
}
