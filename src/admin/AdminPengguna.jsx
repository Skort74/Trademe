import React, { useState } from "react";
import { getRegisteredUsers, updateRegisteredUser, deleteRegisteredUser } from "../utils/auth";
import { transactions } from "../utils/adminStore";
import { getOffers } from "../utils/negotiation";
import {
  Card, CardHeader, TwoColumn, SearchInput, SelectFilter, Table, Row, Cell, Badge, Button,
  DetailPanel, InfoList, ConfirmModal, useStoreData, fmtDate, initials, matches,
} from "./AdminUI";

const userStatus = (u) => u.status || "Aktif";

export default function AdminPengguna({ notify, currentUser }) {
  const [users, refresh] = useStoreData(getRegisteredUsers);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, user }

  const filtered = users.filter(
    (u) =>
      matches(q, u.fullName, u.email, u.username) &&
      (role === "Semua" || (u.role || "user") === role) &&
      (status === "Semua" || userStatus(u) === status)
  );
  const sel = users.find((u) => u.username === selected) || null;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const isSelf = sel && currentUser && sel.username === currentUser.username;
  const isLastAdmin = sel?.role === "admin" && adminCount <= 1;

  const userTx = sel ? transactions.all().filter((t) => t.buyerId === sel.username) : [];
  const userOffers = sel ? getOffers().filter((o) => o.buyerId === sel.username) : [];

  const runConfirm = () => {
    const { type, user } = confirm;
    const name = user.fullName || user.username;
    if (type === "role") {
      const next = user.role === "admin" ? "user" : "admin";
      updateRegisteredUser(user.username, { role: next });
      notify("update", `Role ${name} diubah menjadi ${next}.`);
    } else if (type === "status") {
      const next = userStatus(user) === "Aktif" ? "Nonaktif" : "Aktif";
      updateRegisteredUser(user.username, { status: next });
      notify(next === "Aktif" ? "setujui" : "tolak", `Akun ${name} sekarang ${next.toLowerCase()}.`);
    } else if (type === "delete") {
      deleteRegisteredUser(user.username);
      setSelected(null);
      notify("delete", `Akun ${name} berhasil dihapus.`);
    }
    setConfirm(null);
    refresh();
  };

  const confirmText = () => {
    if (!confirm) return {};
    const { type, user } = confirm;
    const name = user.fullName || user.username;
    if (type === "role")
      return {
        title: user.role === "admin" ? "Cabut Akses Admin?" : "Jadikan Admin?",
        message: user.role === "admin"
          ? `${name} tidak akan bisa membuka Panel Admin lagi.`
          : `${name} akan mendapat akses penuh ke Panel Admin.`,
      };
    if (type === "status")
      return userStatus(user) === "Aktif"
        ? { title: "Nonaktifkan Akun?", message: `${name} tidak akan bisa masuk sampai akunnya diaktifkan kembali.`, danger: true }
        : { title: "Aktifkan Akun?", message: `${name} akan bisa masuk kembali.` };
    return { title: "Hapus Akun?", message: `Akun ${name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`, danger: true };
  };

  return (
    <TwoColumn
      list={
        <Card>
          <CardHeader title="Daftar Pengguna" subtitle={`${users.length} akun terdaftar.`}>
            <SearchInput value={q} onChange={setQ} placeholder="Cari nama / email ..." />
            <SelectFilter value={role} onChange={setRole} placeholder="Role" options={["admin", "user"]} />
            <SelectFilter value={status} onChange={setStatus} placeholder="Status" options={["Aktif", "Nonaktif"]} />
          </CardHeader>
          <Table columns={["Nama", "Email", "Role", "Status", "Bergabung"]} empty="Tidak ada pengguna yang sesuai.">
            {filtered.map((u) => (
              <Row key={u.username} selected={selected === u.username} onClick={() => setSelected(u.username)}>
                <Cell bold>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#DCECE3] text-[#1F6044] text-[9px] font-extrabold flex items-center justify-center shrink-0">
                      {initials(u.fullName || u.username)}
                    </span>
                    <span>{u.fullName || u.username}</span>
                  </div>
                </Cell>
                <Cell>{u.email}</Cell>
                <Cell><Badge>{u.role || "user"}</Badge></Cell>
                <Cell><Badge>{userStatus(u)}</Badge></Cell>
                <Cell>{u.createdAt ? fmtDate(u.createdAt, false) : "Akun bawaan"}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      }
      detail={
        <DetailPanel label="Detail Pengguna">
          {sel && (
            <>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-[#DCECE3] text-[#1F6044] text-sm font-extrabold flex items-center justify-center shrink-0">
                  {initials(sel.fullName || sel.username)}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold text-[#1F2A24] truncate">{sel.fullName || sel.username}</h3>
                  <p className="text-[10px] text-[#66736C] truncate">@{sel.username}</p>
                </div>
              </div>
              <InfoList
                rows={[
                  ["Email", sel.email],
                  ["Role", <Badge>{sel.role || "user"}</Badge>],
                  ["Status", <Badge>{userStatus(sel)}</Badge>],
                  ["Bergabung", sel.createdAt ? fmtDate(sel.createdAt) : "Akun bawaan"],
                  ["Transaksi", `${userTx.length} transaksi`],
                  ["Penawaran harga", `${userOffers.length} penawaran`],
                ]}
              />
              {isSelf && <p className="text-[10px] text-[#66736C] mb-2">Ini akun Anda sendiri — tidak bisa diubah dari sini.</p>}
              {!isSelf && isLastAdmin && <p className="text-[10px] text-[#66736C] mb-2">Admin terakhir tidak bisa diturunkan atau dihapus.</p>}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={isSelf || isLastAdmin} onClick={() => setConfirm({ type: "role", user: sel })}>
                  {sel.role === "admin" ? "Cabut Admin" : "Jadikan Admin"}
                </Button>
                <Button variant={userStatus(sel) === "Aktif" ? "danger" : "approve"} disabled={isSelf || isLastAdmin}
                  onClick={() => setConfirm({ type: "status", user: sel })}>
                  {userStatus(sel) === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button variant="danger" className="col-span-2" disabled={isSelf || isLastAdmin}
                  onClick={() => setConfirm({ type: "delete", user: sel })}>
                  Hapus Akun
                </Button>
              </div>
            </>
          )}
          <ConfirmModal open={!!confirm} {...confirmText()} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />
        </DetailPanel>
      }
    />
  );
}
