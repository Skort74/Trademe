import React, { useState } from "react";
import { foundations } from "../utils/adminStore";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, Modal, Field, inputCls, textareaCls, useStoreData, fmtDate, matches,
} from "./AdminUI";

const EMPTY_FORM = { name: "", location: "", contact: "", description: "", needs: "", status: "Aktif" };

export default function AdminYayasan({ notify }) {
  const [list] = useStoreData(foundations.all);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // null = modal tertutup
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState("");

  const filtered = list.filter(
    (y) => matches(q, y.name, y.location, y.contact) && (status === "Semua" || y.status === status)
  );
  const sel = list.find((y) => y.id === selectedId) || null;

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError("Nama dan lokasi yayasan wajib diisi.");
      return;
    }
    const duplicate = list.find(
      (y) => y.name.trim().toLowerCase() === form.name.trim().toLowerCase() && y.id !== form.id
    );
    if (duplicate) {
      setError("Yayasan dengan nama ini sudah terdaftar.");
      return;
    }
    const data = {
      name: form.name.trim(),
      location: form.location.trim(),
      contact: form.contact.trim(),
      description: form.description.trim(),
      needs: form.needs.trim(),
      status: form.status,
    };
    if (form.id) {
      foundations.update(form.id, data);
      notify("update", `Data yayasan "${data.name}" diperbarui.`);
    } else {
      const rec = foundations.add({ ...data, source: "Admin" });
      setSelectedId(rec.id);
      notify("create", `Yayasan "${data.name}" berhasil ditambahkan.`);
    }
    setForm(null);
  };

  const toggleStatus = () => {
    const next = sel.status === "Aktif" ? "Nonaktif" : "Aktif";
    foundations.update(sel.id, { status: next });
    notify(next === "Aktif" ? "setujui" : "tolak", `Yayasan "${sel.name}" sekarang ${next.toLowerCase()}.`);
  };

  const confirmDelete = () => {
    foundations.remove(toDelete.id);
    if (selectedId === toDelete.id) setSelectedId(null);
    notify("delete", `Yayasan "${toDelete.name}" dihapus.`);
    setToDelete(null);
  };

  const openForm = (y) => {
    setError("");
    setForm(y ? { ...EMPTY_FORM, ...y } : { ...EMPTY_FORM });
  };

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Yayasan Mitra" subtitle={`${list.filter((y) => y.status === "Aktif").length} yayasan aktif menerima donasi.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari yayasan ..." />
            <SelectFilter value={status} onChange={setStatus} placeholder="Status" options={["Aktif", "Nonaktif"]} />
            <Button variant="primary" onClick={() => openForm(null)}>
              <span className="text-base leading-none font-normal">+</span> Tambah Yayasan
            </Button>
          </CardHeader>
          <Table
            columns={["Nama Yayasan", "Lokasi", "Kontak", "Status", "Terdaftar"]}
            empty="Belum ada yayasan. Tambahkan manual, atau setujui pengajuan yayasan di tab Verifikasi Penerima."
          >
            {filtered.map((y) => (
              <Row key={y.id} selected={selectedId === y.id} onClick={() => setSelectedId(y.id)}>
                <Cell bold>{y.name}</Cell>
                <Cell>{y.location}</Cell>
                <Cell>{y.contact || "-"}</Cell>
                <Cell><Badge>{y.status}</Badge></Cell>
                <Cell>{fmtDate(y.createdAt, false)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Yayasan">
          {sel && (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[16px] font-bold text-[#1F2A24]">{sel.name}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" onClick={() => openForm(sel)}
                    className="px-2 py-0.5 rounded text-[9px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer">
                    ✎ Edit
                  </button>
                  <button type="button" onClick={() => setToDelete(sel)}
                    className="px-2 py-0.5 rounded text-[9px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer">
                    ✕ Hapus
                  </button>
                </div>
              </div>
              <InfoList
                rows={[
                  ["Status", <Badge>{sel.status}</Badge>],
                  ["Lokasi", sel.location],
                  ["Kontak", sel.contact || "-"],
                  ["Sumber data", sel.source || "Admin"],
                  ["Terdaftar", fmtDate(sel.createdAt)],
                ]}
              />
              {sel.description && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-[#56635B] mb-0.5">Tentang yayasan</p>
                  <p className="text-[11px] text-[#1F2A24] whitespace-pre-wrap">{sel.description}</p>
                </div>
              )}
              {sel.needs && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-[#56635B] mb-0.5">Kebutuhan barang</p>
                  <p className="text-[11px] text-[#1F2A24] whitespace-pre-wrap">{sel.needs}</p>
                </div>
              )}
              <Button variant={sel.status === "Aktif" ? "danger" : "approve"} className="w-full" onClick={toggleStatus}>
                {sel.status === "Aktif" ? "Nonaktifkan Yayasan" : "Aktifkan Yayasan"}
              </Button>
            </>
          )}

          <Modal
            open={!!form}
            title={form?.id ? "Edit Yayasan" : "Tambah Yayasan"}
            subtitle="Yayasan aktif dapat dipilih sebagai penerima donasi."
            onClose={() => setForm(null)}
          >
            {form && (
              <form onSubmit={submit} className="space-y-4">
                <Field label="Nama yayasan" required>
                  <input value={form.name} onChange={setField("name")} placeholder="Contoh: Yayasan Kasih Anak" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lokasi" required>
                    <input value={form.location} onChange={setField("location")} placeholder="Contoh: Gubeng, Surabaya" className={inputCls} />
                  </Field>
                  <Field label="Kontak">
                    <input value={form.contact} onChange={setField("contact")} placeholder="No. HP / email" className={inputCls} />
                  </Field>
                </div>
                <Field label="Tentang yayasan">
                  <textarea rows="3" value={form.description} onChange={setField("description")} className={textareaCls} />
                </Field>
                <Field label="Kebutuhan barang">
                  <textarea rows="2" value={form.needs} onChange={setField("needs")} placeholder="Contoh: Buku pelajaran, meja belajar, pakaian anak" className={textareaCls} />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={setField("status")} className={inputCls}>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </Field>
                {error && <p className="text-[11px] text-red-600 font-semibold">{error}</p>}
                <div className="pt-3 border-t border-[#E8EDE9] flex justify-end gap-2.5">
                  <Button onClick={() => setForm(null)}>Batal</Button>
                  <Button type="submit" variant="primary">{form.id ? "Perbarui" : "Simpan"}</Button>
                </div>
              </form>
            )}
          </Modal>

          <ConfirmModal
            open={!!toDelete}
            title="Hapus Yayasan?"
            message={toDelete ? `"${toDelete.name}" akan dihapus permanen dari daftar mitra.` : ""}
            confirmLabel="Ya, Hapus"
            danger
            onCancel={() => setToDelete(null)}
            onConfirm={confirmDelete}
          />
        </DetailPanel>
      }
    />
  );
}
