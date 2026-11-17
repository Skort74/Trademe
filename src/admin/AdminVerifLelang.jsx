import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, Field, inputCls, textareaCls, fmtRp, fmtDate, matches,
} from "./AdminUI";

// Barang berjenis "Lelang" dari tab Barang (state items milik PanelAdminBarang).
// Data lelang disimpan di field item.lelang:
// { startPrice, increment, endsAt, verif: "Menunggu Verifikasi" | "Disetujui" | "Ditolak", note, verifiedAt }

const verifStatus = (item) => item.lelang?.verif || "Menunggu Verifikasi";

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fmtNum = (v) => (v ? Number(v).toLocaleString("id-ID") : "");
const parseNum = (s) => Number(String(s || "").replace(/\D/g, ""));

export default function AdminVerifLelang({ items, setItems, notify }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ startPrice: "", increment: "", endsAt: "", note: "" });
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null); // "approve" | "reject"

  const auctions = items.filter((i) => i.jenis === "Lelang");
  const filtered = auctions.filter(
    (i) => matches(q, i.barang, i.pemilik) && (status === "Semua" || verifStatus(i) === status)
  );
  const sel = auctions.find((i) => i.id === selectedId) || null;
  const pending = auctions.filter((i) => verifStatus(i) === "Menunggu Verifikasi").length;
  const locked = sel && verifStatus(sel) !== "Menunggu Verifikasi";

  useEffect(() => {
    const l = sel?.lelang || {};
    setForm({
      startPrice: fmtNum(l.startPrice),
      increment: fmtNum(l.increment),
      endsAt: toLocalInput(l.endsAt),
      note: l.note || "",
    });
    setError("");
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setMoney = (k) => (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, [k]: raw ? Number(raw).toLocaleString("id-ID") : "" }));
    setError("");
  };

  const updateLelang = (patch) =>
    setItems((prev) => prev.map((it) => (it.id === sel.id ? { ...it, lelang: { ...(it.lelang || {}), ...patch } } : it)));

  const askApprove = () => {
    const startPrice = parseNum(form.startPrice);
    const increment = parseNum(form.increment);
    if (!startPrice) return setError("Harga awal wajib diisi.");
    if (!increment) return setError("Kelipatan tawaran wajib diisi.");
    if (increment >= startPrice) return setError("Kelipatan harus lebih kecil dari harga awal.");
    if (!form.endsAt) return setError("Tentukan waktu berakhirnya lelang.");
    if (new Date(form.endsAt) <= new Date()) return setError("Waktu berakhir harus di masa depan.");
    setConfirm("approve");
  };

  const askReject = () => {
    if (!form.note.trim()) return setError("Tulis alasan penolakan di catatan.");
    setConfirm("reject");
  };

  const run = () => {
    const approve = confirm === "approve";
    updateLelang({
      ...(approve
        ? {
            startPrice: parseNum(form.startPrice),
            increment: parseNum(form.increment),
            endsAt: new Date(form.endsAt).toISOString(),
          }
        : {}),
      verif: approve ? "Disetujui" : "Ditolak",
      note: form.note.trim(),
      verifiedAt: new Date().toISOString(),
    });
    notify(approve ? "setujui" : "tolak", `Lelang "${sel.barang}" ${approve ? "disetujui dan siap tayang" : "ditolak"}.`);
    setConfirm(null);
  };

  const reopen = () => {
    updateLelang({ verif: "Menunggu Verifikasi", verifiedAt: null });
    notify("update", `Lelang "${sel.barang}" dikembalikan ke antrean verifikasi.`);
  };

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Verifikasi Barang Lelang" subtitle={`${pending} barang lelang menunggu verifikasi.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari barang / pemilik ..." />
            <SelectFilter value={status} onChange={setStatus} placeholder="Status" options={["Menunggu Verifikasi", "Disetujui", "Ditolak"]} />
          </CardHeader>
          <Table
            columns={["Barang", "Pemilik", "Harga Awal", "Berakhir", "Status"]}
            empty="Tidak ada barang lelang. Barang dengan jenis “Lelang” di tab Barang akan muncul di sini."
          >
            {filtered.map((i) => (
              <Row key={i.id} selected={selectedId === i.id} onClick={() => setSelectedId(i.id)}>
                <Cell bold>{i.barang}</Cell>
                <Cell>{i.pemilik}</Cell>
                <Cell>{i.lelang?.startPrice ? fmtRp(i.lelang.startPrice) : "-"}</Cell>
                <Cell>{i.lelang?.endsAt ? fmtDate(i.lelang.endsAt) : "-"}</Cell>
                <Cell><Badge>{verifStatus(i)}</Badge></Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Lelang">
          {sel && (
            <>
              {sel.image && (
                <div className="w-full h-[130px] rounded-[11px] overflow-hidden bg-gray-100 border border-[#E8EDE9]">
                  <img src={sel.image} alt={sel.barang} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-[16px] font-bold text-[#1F2A24] mt-3">{sel.barang}</h3>
              <p className="text-[10px] text-[#66736C]">{sel.pemilik} · {sel.kondisi}</p>
              <InfoList
                rows={[
                  ["Status verifikasi", <Badge>{verifStatus(sel)}</Badge>],
                  ["Status kurasi barang", <Badge>{sel.kurasi}</Badge>],
                  sel.lelang?.verifiedAt && ["Diverifikasi", fmtDate(sel.lelang.verifiedAt)],
                ]}
              />
              {sel.kurasi !== "Disetujui" && !locked && (
                <p className="text-[10px] text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] rounded-lg px-2.5 py-1.5 mb-3">
                  Barang ini belum disetujui di kurasi tab Barang. Pastikan kondisi barang sudah dicek.
                </p>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Harga awal" required>
                    <input inputMode="numeric" value={form.startPrice} onChange={setMoney("startPrice")} disabled={locked}
                      placeholder="0" className={`${inputCls} disabled:bg-[#F8FAF9]`} />
                  </Field>
                  <Field label="Kelipatan" required>
                    <input inputMode="numeric" value={form.increment} onChange={setMoney("increment")} disabled={locked}
                      placeholder="0" className={`${inputCls} disabled:bg-[#F8FAF9]`} />
                  </Field>
                </div>
                <Field label="Lelang berakhir" required>
                  <input type="datetime-local" value={form.endsAt} disabled={locked}
                    onChange={(e) => { setForm((f) => ({ ...f, endsAt: e.target.value })); setError(""); }}
                    className={`${inputCls} disabled:bg-[#F8FAF9]`} />
                </Field>
                <Field label="Catatan verifikasi">
                  <textarea rows="2" value={form.note} disabled={locked}
                    onChange={(e) => { setForm((f) => ({ ...f, note: e.target.value })); setError(""); }}
                    placeholder="Wajib diisi jika menolak" className={`${textareaCls} disabled:bg-[#F8FAF9]`} />
                </Field>
              </div>
              {error && <p className="text-[10px] text-red-600 font-semibold mt-2">{error}</p>}

              {!locked ? (
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="approve" className="flex-1" onClick={askApprove}>Setujui Lelang</Button>
                  <Button variant="danger" className="flex-1" onClick={askReject}>Tolak</Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full mt-3" onClick={reopen}>Tinjau Ulang</Button>
              )}
            </>
          )}
          <ConfirmModal
            open={!!confirm}
            title={confirm === "approve" ? "Setujui Lelang?" : "Tolak Lelang?"}
            message={
              sel
                ? confirm === "approve"
                  ? `"${sel.barang}" akan dilelang mulai ${fmtRp(parseNum(form.startPrice))} dengan kelipatan ${fmtRp(parseNum(form.increment))}.`
                  : `Pengajuan lelang "${sel.barang}" akan ditolak.`
                : ""
            }
            danger={confirm === "reject"}
            onCancel={() => setConfirm(null)}
            onConfirm={run}
          />
        </DetailPanel>
      }
    />
  );
}
