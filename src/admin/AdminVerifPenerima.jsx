import React, { useState, useEffect } from "react";
import { recipientApplications, foundations } from "../utils/adminStore";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, textareaCls, useStoreData, fmtDate, matches,
} from "./AdminUI";

const tipeLabel = (t) => (t === "yayasan" ? "Yayasan" : "Perorangan");
const appName = (a) => (a.tipe_penerima === "yayasan" ? a.nama_lembaga : a.applicantName) || "Tanpa nama";

export default function AdminVerifPenerima({ notify }) {
  const [list] = useStoreData(recipientApplications.all);
  const [q, setQ] = useState("");
  const [tipe, setTipe] = useState("Semua");
  const [status, setStatus] = useState("Menunggu");
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null); // "approve" | "reject"
  const [error, setError] = useState("");

  const filtered = list.filter(
    (a) =>
      matches(q, appName(a), a.applicantName, a.lokasi, a.alasan_kebutuhan) &&
      (tipe === "Semua" || tipeLabel(a.tipe_penerima) === tipe) &&
      (status === "Semua" || a.status === status)
  );
  const sel = list.find((a) => a.id === selectedId) || null;
  const pending = list.filter((a) => a.status === "Menunggu").length;

  useEffect(() => {
    setNote(sel?.adminNote || "");
    setError("");
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const askReject = () => {
    if (!note.trim()) {
      setError("Tulis alasan penolakan di catatan agar pemohon tahu apa yang perlu diperbaiki.");
      return;
    }
    setConfirm("reject");
  };

  const run = () => {
    const approve = confirm === "approve";
    recipientApplications.update(sel.id, {
      status: approve ? "Disetujui" : "Ditolak",
      adminNote: note.trim(),
      verifiedAt: new Date().toISOString(),
    });

    // Pengajuan yayasan yang disetujui otomatis masuk daftar Yayasan Mitra
    if (approve && sel.tipe_penerima === "yayasan") {
      const exists = foundations
        .all()
        .some((y) => y.name.trim().toLowerCase() === String(sel.nama_lembaga || "").trim().toLowerCase());
      if (!exists) {
        foundations.add({
          name: sel.nama_lembaga,
          location: sel.lokasi,
          contact: sel.applicantEmail || "",
          description: sel.alasan_kebutuhan,
          needs: "",
          status: "Aktif",
          source: "Pengajuan penerima",
          applicationId: sel.id,
        });
      }
    }

    notify(
      approve ? "setujui" : "tolak",
      `Pengajuan "${appName(sel)}" ${approve ? "disetujui" : "ditolak"}.` +
        (approve && sel.tipe_penerima === "yayasan" ? " Yayasan ditambahkan ke daftar mitra." : "")
    );
    setConfirm(null);
  };

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Pengajuan Penerima Donasi" subtitle={`${pending} pengajuan menunggu verifikasi.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari nama / lokasi ..." />
            <SelectFilter value={tipe} onChange={setTipe} placeholder="Tipe" options={["Yayasan", "Perorangan"]} />
            <SelectFilter value={status} onChange={setStatus} placeholder="Semua status" options={["Menunggu", "Disetujui", "Ditolak"]} />
          </CardHeader>
          <Table
            columns={["Nama", "Tipe", "Lokasi", "Diajukan oleh", "Status", "Tanggal"]}
            empty="Tidak ada pengajuan. Pengajuan masuk dari tombol “Ajukan Penerima” di halaman donasi."
          >
            {filtered.map((a) => (
              <Row key={a.id} selected={selectedId === a.id} onClick={() => setSelectedId(a.id)}>
                <Cell bold>{appName(a)}</Cell>
                <Cell>{tipeLabel(a.tipe_penerima)}</Cell>
                <Cell>{a.lokasi}</Cell>
                <Cell>{a.applicantName || "Tamu"}</Cell>
                <Cell><Badge>{a.status}</Badge></Cell>
                <Cell>{fmtDate(a.createdAt, false)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Pengajuan">
          {sel && (
            <>
              <h3 className="text-[16px] font-bold text-[#1F2A24]">{appName(sel)}</h3>
              <p className="text-[10px] text-[#66736C]">{tipeLabel(sel.tipe_penerima)} · {sel.lokasi}</p>
              <div className="mt-3 p-3 rounded-xl bg-[#F8FAF9] border border-[#E8EDE9]">
                <p className="text-[10px] font-bold text-[#56635B] mb-1">Alasan kebutuhan</p>
                <p className="text-[11px] text-[#1F2A24] whitespace-pre-wrap">{sel.alasan_kebutuhan}</p>
              </div>
              <InfoList
                rows={[
                  ["Status", <Badge>{sel.status}</Badge>],
                  ["Diajukan oleh", sel.applicantName || "Tamu (belum masuk)"],
                  sel.applicantEmail && ["Email", sel.applicantEmail],
                  ["Tanggal", fmtDate(sel.createdAt)],
                  ["Dokumen", sel.dokumen?.length ? `${sel.dokumen.length} file` : "Tidak ada"],
                  sel.verifiedAt && ["Diverifikasi", fmtDate(sel.verifiedAt)],
                ]}
              />
              {sel.dokumen?.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {sel.dokumen.map((d) => (
                    <li key={d} className="text-[10px] text-[#1F2A24] bg-[#F8FAF9] border border-[#E8EDE9] rounded-lg px-2.5 py-1.5 truncate">
                      📎 {d}
                    </li>
                  ))}
                </ul>
              )}

              <label htmlFor="catatan-penerima" className="block text-[#56635B] text-[10px] font-bold mb-1">
                Catatan verifikasi {sel.status === "Menunggu" && <span className="font-normal">(wajib jika menolak)</span>}
              </label>
              <textarea id="catatan-penerima" rows="3" value={note}
                onChange={(e) => { setNote(e.target.value); setError(""); }}
                disabled={sel.status !== "Menunggu"} placeholder="Catatan untuk pemohon..."
                className={`${textareaCls} disabled:bg-[#F8FAF9]`} />
              {error && <p className="text-[10px] text-red-600 font-semibold mt-1">{error}</p>}

              {sel.status === "Menunggu" && (
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="approve" className="flex-1" onClick={() => setConfirm("approve")}>Setujui</Button>
                  <Button variant="danger" className="flex-1" onClick={askReject}>Tolak</Button>
                </div>
              )}
            </>
          )}
          <ConfirmModal
            open={!!confirm}
            title={confirm === "approve" ? "Setujui Pengajuan?" : "Tolak Pengajuan?"}
            message={
              sel
                ? confirm === "approve"
                  ? `"${appName(sel)}" akan terverifikasi sebagai penerima donasi.` +
                    (sel.tipe_penerima === "yayasan" ? " Yayasan juga akan ditambahkan ke daftar mitra." : "")
                  : `Pengajuan "${appName(sel)}" akan ditolak.`
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
