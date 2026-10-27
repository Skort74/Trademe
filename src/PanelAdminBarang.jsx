import React, { useState, useEffect } from "react";

const INITIAL_ITEMS = [
  {
    id: 1,
    barang: "Meja Belajar Kayu",
    pemilik: "Nadia Rahma",
    jenis: "Donasi",
    kurasi: "Menunggu",
    kondisi: "Kondisi baik",
    image: "/ImageMejaBelajarKayu.png",
    catatan: "Perlu cek kelengkapan baut dan kebersihan kayu.",
  },
  {
    id: 2,
    barang: "Kamera Analog",
    pemilik: "Rian Putra",
    jenis: "Lelang",
    kurasi: "Ditinjau",
    kondisi: "Fungsi normal, mulus",
    image: "/images/hero-antique.jpg",
    catatan: "Shutter speed dan aperture bekerja dengan baik.",
  },
  {
    id: 3,
    barang: "Sepeda Lipat",
    pemilik: "Budi Santoso",
    jenis: "Jual",
    kurasi: "Dilaporkan",
    kondisi: "Cat orisinal, siap pakai",
    image: "/images/vintage-bike.jpg",
    catatan: "Laporan terkait foto kurang jelas dari sudut belakang.",
  },
];

const PRESET_IMAGES = [
  { label: "Meja Kayu", url: "/ImageMejaBelajarKayu.png" },
  { label: "Kamera / Antik", url: "/images/hero-antique.jpg" },
  { label: "Sepeda Lipat", url: "/images/vintage-bike.jpg" },
  { label: "Meja Jati", url: "/images/meja-jati.jpg" },
  { label: "Kursi Cafe", url: "/images/kursi-cafe.jpg" },
];

export default function PanelAdminBarang() {
  const [activeMenu, setActiveMenu] = useState("barang");
  const [selectedId, setSelectedId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [actionNotice, setActionNotice] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");

  // Load from localStorage if exists, otherwise fallback to INITIAL_ITEMS
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("trademe_admin_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse items from localStorage", e);
    }
    return INITIAL_ITEMS;
  });

  // Save to localStorage whenever items changes
  useEffect(() => {
    try {
      localStorage.setItem("trademe_admin_items", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save items to localStorage", e);
    }
  }, [items]);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [formData, setFormData] = useState({
    id: null,
    barang: "",
    pemilik: "",
    jenis: "Donasi",
    kurasi: "Menunggu",
    kondisi: "",
    image: "/ImageMejaBelajarKayu.png",
    catatan: "",
  });

  // Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState(null);

  // Selected item reference
  const selectedItem =
    items.find((it) => it.id === selectedId) || items[0] || null;

  // Sync notes when selectedItem changes
  const [currentNote, setCurrentNote] = useState("");
  useEffect(() => {
    if (selectedItem) {
      setCurrentNote(selectedItem.catatan || "");
    }
  }, [selectedItem]);

  const menuItems = [
    { id: "ringkasan", label: "Ringkasan", icon: "R" },
    { id: "pengguna", label: "Pengguna", icon: "P" },
    { id: "barang", label: "Barang", icon: "B" },
    { id: "transaksi", label: "Transaksi", icon: "T" },
    { id: "sengketa", label: "Sengketa", icon: "S" },
    { id: "yayasan", label: "Yayasan", icon: "Y" },
    { id: "verif-penerima", label: "Verifikasi Penerima", icon: "V" },
    { id: "verif-lelang", label: "Verifikasi Lelang", icon: "V" },
    { id: "tentukan-pemenang", label: "Tentukan Pemenang", icon: "T" },
  ];

  // Filtering items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pemilik.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJenis =
      selectedJenis === "Semua" || item.jenis === selectedJenis;
    const matchesStatus =
      selectedStatus === "Semua" || item.kurasi === selectedStatus;
    return matchesSearch && matchesJenis && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setUploadFileName("");
    setFormData({
      id: null,
      barang: "",
      pemilik: "",
      jenis: "Donasi",
      kurasi: "Menunggu",
      kondisi: "Kondisi baik",
      image: "/ImageMejaBelajarKayu.png",
      catatan: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setUploadFileName("");
    setFormData({
      id: item.id,
      barang: item.barang,
      pemilik: item.pemilik,
      jenis: item.jenis,
      kurasi: item.kurasi,
      kondisi: item.kondisi || "",
      image: item.image || "/ImageMejaBelajarKayu.png",
      catatan: item.catatan || "",
    });
    setIsModalOpen(true);
  };

  // Handle Local Computer Image Upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Silakan pilih file gambar yang valid (JPG, PNG, WEBP).");
      return;
    }

    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize dimensions to keep local storage lightweight
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFormData((prev) => ({
          ...prev,
          image: dataUrl,
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Submit Create or Edit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.barang.trim() || !formData.pemilik.trim()) {
      alert("Nama barang dan pemilik wajib diisi!");
      return;
    }

    if (modalMode === "create") {
      const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
      const newItem = {
        ...formData,
        id: newId,
        image: formData.image || "/ImageMejaBelajarKayu.png",
      };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newId);
      triggerNotice("create", `Barang baru "${newItem.barang}" berhasil ditambahkan!`);
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === formData.id ? { ...formData } : item))
      );
      triggerNotice("update", `Data barang "${formData.barang}" berhasil diperbarui!`);
    }

    setIsModalOpen(false);
  };

  // Prompt Delete
  const handlePromptDelete = (item, e) => {
    if (e) e.stopPropagation();
    setItemToDelete(item);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.barang;
    const remaining = items.filter((i) => i.id !== itemToDelete.id);
    setItems(remaining);

    // If deleted item was selected, select next available
    if (selectedId === itemToDelete.id) {
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    }

    setItemToDelete(null);
    triggerNotice("delete", `Barang "${deletedName}" berhasil dihapus.`);
  };

  // Update Note from Detail Card
  const handleSaveNote = () => {
    if (!selectedItem) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, catatan: currentNote } : item
      )
    );
    triggerNotice("update", `Catatan kurasi untuk "${selectedItem.barang}" berhasil disimpan.`);
  };

  // Quick Action: Setujui / Tolak
  const handleAction = (statusType) => {
    if (!selectedItem) return;
    const newStatus = statusType === "setujui" ? "Disetujui" : "Ditolak";
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, kurasi: newStatus, catatan: currentNote }
          : item
      )
    );
    triggerNotice(
      statusType,
      `Barang "${selectedItem.barang}" berhasil di-${
        statusType === "setujui" ? "setujui" : "tolak"
      }.`
    );
  };

  const triggerNotice = (type, text) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="flex min-h-screen bg-[#F6FAF7] font-sans antialiased text-[#1F2A24] selection:bg-[#E5F2EB]">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[245px] bg-white border-r border-[#DCE6DF] flex flex-col justify-between shrink-0 p-5 sticky top-0 h-screen select-none overflow-y-auto z-10">
        <div>
          {/* Logo TradeMe */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-[35px] h-[35px] rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_0_rgba(47,125,91,0.22)] flex items-center justify-center shrink-0">
              <span className="text-white text-[19px] font-extrabold tracking-[-0.036em]">
                T
              </span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.033em]">
              TradeMe
            </span>
          </div>

          {/* Section Heading: ADMIN PANEL */}
          <div className="px-2.5 pb-2.5">
            <span className="text-[#A0AAA3] text-[9px] font-extrabold tracking-[0.175em] uppercase">
              ADMIN PANEL
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 w-full">
            {menuItems.map((menu) => {
              const isActive = activeMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveMenu(menu.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-[#2F7D5B] text-white shadow-sm font-semibold"
                      : "text-[#56635B] hover:bg-[#F0F5F2] font-semibold"
                  }`}
                >
                  <div
                    className={`w-[23px] h-[23px] rounded-[7px] flex items-center justify-center shrink-0 text-[9px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#EDF2EF] text-[#56635B]"
                    }`}
                  >
                    {menu.icon}
                  </div>
                  <span className="text-xs">{menu.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Back Link */}
        <div className="pt-6 px-2.5">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-[#2F7D5B] text-xs font-bold hover:underline cursor-pointer transition-colors"
          >
            <span>←</span> Kembali ke situs
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 py-7 px-9 overflow-y-auto">
        <div className="max-w-[1180px]">
          {/* Top Header */}
          <header className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[#2F7D5B] text-[11px] font-extrabold tracking-[0.163em] uppercase">
                PUSAT KENDALI
              </p>
              <h1 className="text-[#1F2A24] text-[30px] font-bold leading-tight mt-1">
                Barang 
              </h1>
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="w-[43px] h-[43px] rounded-full bg-[#DCECE3] flex items-center justify-center shrink-0">
                <span className="text-[#1F6044] text-xs font-extrabold">AD</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#1F2A24] text-xs font-bold leading-tight">
                  Admin TradeMe
                </span>
                <span className="text-[#66736C] text-[10px] leading-tight mt-0.5">
                  Super Admin
                </span>
              </div>
            </div>
          </header>

          {/* Action Notification Banner */}
          {actionNotice && (
            <div
              className={`mb-5 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
                actionNotice.type === "setujui" || actionNotice.type === "create"
                  ? "bg-[#E5F2EB] border-[#B7D9C6] text-[#1F6044]"
                  : actionNotice.type === "delete" || actionNotice.type === "tolak"
                  ? "bg-[#FAE8E8] border-[#EFC8CB] text-[#A83F49]"
                  : "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>
                  {actionNotice.type === "delete" ? "🗑️" : actionNotice.type === "create" ? "✨" : "✓"}
                </span>
                <span>{actionNotice.text}</span>
              </div>
              <button
                onClick={() => setActionNotice(null)}
                className="text-xs font-bold ml-3 cursor-pointer opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================= CARD 1: DAFTAR BARANG  ================= */}
          <section className="bg-white border border-[#DCE6DF] rounded-[15px] p-5 shadow-sm">
            {/* Header with Title & Filter Bar & Tambah Barang Button */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-4">
              <div>
                <h2 className="text-[#1F2A24] text-[15px] font-bold">
                  Daftar Barang 
                </h2>
                <p className="text-[#66736C] text-[11px] mt-0.5">
                  Pilih data untuk melihat detail dan melakukan tindakan.
                </p>
              </div>

              {/* Action and Filters toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Search Box */}
                <div className="relative flex items-center">
                  <svg
                    className="w-3.5 h-3.5 absolute left-3 text-[#8A948E] pointer-events-none"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M11 11L14.5 14.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari barang ..."
                    className="w-[170px] lg:w-[190px] h-[38px] pl-9 pr-3 rounded-[10px] border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] placeholder-[rgba(31,42,36,0.50)] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B] transition-all"
                  />
                </div>

                {/* Dropdown: Jenis */}
                <div className="relative">
                  <select
                    value={selectedJenis}
                    onChange={(e) => setSelectedJenis(e.target.value)}
                    className="h-[38px] pl-3 pr-7 rounded-[9px] border border-[#DCE6DF] bg-white text-xs text-[#66736C] appearance-none focus:outline-none focus:border-[#2F7D5B] cursor-pointer"
                  >
                    <option value="Semua">Jenis</option>
                    <option value="Donasi">Donasi</option>
                    <option value="Lelang">Lelang</option>
                    <option value="Jual">Jual</option>
                  </select>
                  <svg
                    className="w-2.5 h-2 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66736C] pointer-events-none"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Dropdown: Status Kurasi */}
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-[38px] pl-3 pr-7 rounded-[9px] border border-[#DCE6DF] bg-white text-xs text-[#66736C] appearance-none focus:outline-none focus:border-[#2F7D5B] cursor-pointer"
                  >
                    <option value="Semua">Status kurasi</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Ditinjau">Ditinjau</option>
                    <option value="Dilaporkan">Dilaporkan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                  <svg
                    className="w-2.5 h-2 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66736C] pointer-events-none"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* + Tambah Barang Button */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="h-[38px] px-3.5 rounded-[9px] bg-[#2F7D5B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#25664a] active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <span className="text-base leading-none font-normal">+</span>
                  <span>Tambah Barang</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAF8] border-b border-[#E8EDE9]">
                    <th className="py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase w-[28%]">
                      Barang
                    </th>
                    <th className="py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase w-[22%]">
                      Pemilik
                    </th>
                    <th className="py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase w-[16%]">
                      Jenis
                    </th>
                    <th className="py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase w-[16%]">
                      Kurasi
                    </th>
                    <th className="py-2.5 px-4 text-[#78847D] text-[9px] font-bold tracking-[0.087em] uppercase text-center w-[18%]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`border-b border-[#E8EDE9] transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-[#F1F7F3]"
                            : "bg-white hover:bg-[#F8FAF9]"
                        }`}
                      >
                        <td className="py-3 px-4 text-[#1F2A24] text-[11px] font-bold">
                          {item.barang}
                        </td>
                        <td className="py-3 px-4 text-[#1F2A24] text-[11px]">
                          {item.pemilik}
                        </td>
                        <td className="py-3 px-4 text-[#1F2A24] text-[11px]">
                          {item.jenis}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              item.kurasi === "Disetujui"
                                ? "bg-[#D1FAE5] text-[#065F46]"
                                : item.kurasi === "Ditolak"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "bg-[#E5F2EB] text-[#1F6044]"
                            }`}
                          >
                            {item.kurasi}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Lihat Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(item.id);
                              }}
                              className="px-2.5 py-1 rounded-md border border-[#DCE6DF] bg-white text-[#2F7D5B] text-[9px] font-bold hover:bg-[#E5F2EB] active:scale-95 transition-all cursor-pointer"
                              title="Lihat Detail"
                            >
                              Lihat
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(item);
                              }}
                              className="px-2 py-1 rounded-md border border-[#DCE6DF] bg-white text-[#2563EB] text-[9px] font-bold hover:bg-[#EFF6FF] active:scale-95 transition-all cursor-pointer"
                              title="Edit Barang"
                            >
                              Edit
                            </button>

                            {/* Hapus Button */}
                            <button
                              type="button"
                              onClick={(e) => handlePromptDelete(item, e)}
                              className="px-2 py-1 rounded-md border border-[#FCA5A5] bg-white text-[#DC2626] text-[9px] font-bold hover:bg-[#FEF2F2] active:scale-95 transition-all cursor-pointer"
                              title="Hapus Barang"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-10 text-center text-xs text-gray-400"
                      >
                        <p className="mb-2">Tidak ada barang yang sesuai.</p>
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="px-3 py-1.5 rounded-lg bg-[#2F7D5B] text-white text-xs font-bold hover:bg-[#25664a] cursor-pointer"
                        >
                          + Tambah Barang Baru
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= CARD 2: DETAIL KURASI ================= */}
          {selectedItem && (
            <section className="flex justify-end w-full mt-5 pb-6">
              <div className="w-[430px] max-w-full bg-white border border-[#DCE6DF] rounded-[15px] p-5 shadow-[0_9px_28px_0_rgba(31,74,51,0.06)]">
                {/* Header label with Edit & Delete shortcuts */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#2F7D5B] text-[9px] font-extrabold tracking-[0.137em] uppercase">
                    DETAIL KURASI
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedItem)}
                      className="px-2 py-0.5 rounded text-[9px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      ✎ Edit Data
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handlePromptDelete(selectedItem, e)}
                      className="px-2 py-0.5 rounded text-[9px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      ✕ Hapus
                    </button>
                  </div>
                </div>

                {/* Item Image */}
                <div className="w-full h-[140px] rounded-[11px] overflow-hidden bg-gray-100 border border-[#E8EDE9]">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.barang}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/meja-jati.jpg";
                    }}
                  />
                </div>

                {/* Title & Metadata */}
                <h3 className="text-[#1F2A24] text-[17px] font-bold tracking-tight mt-3">
                  {selectedItem.barang}
                </h3>
                <p className="text-[#66736C] text-[10px] mt-0.5 mb-3">
                  {selectedItem.jenis} · {selectedItem.pemilik} · {selectedItem.kondisi}
                </p>

                {/* Curate Note Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="catatan-kurasi"
                      className="text-[#56635B] text-[10px] font-bold"
                    >
                      Catatan kurasi
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="text-[9px] font-bold text-[#2F7D5B] hover:underline cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                  <textarea
                    id="catatan-kurasi"
                    rows="2"
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="Catatan untuk pemilik..."
                    className="w-full rounded-lg border border-[#DCE6DF] p-2.5 text-xs text-[#1F2A24] placeholder-[rgba(86,99,91,0.50)] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B] transition-all resize-none"
                  />
                </div>

                {/* Action Buttons: Setujui & Tolak */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleAction("setujui")}
                    className="cursor-pointer flex-1 h-[36px] px-2.5 flex justify-center items-center rounded-lg border border-[#B7D9C6] bg-[#E5F2EB] text-[#1F6044] text-[10px] font-extrabold hover:bg-[#d5eadf] active:scale-[0.98] transition-all"
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("tolak")}
                    className="cursor-pointer flex-1 h-[36px] px-2.5 flex justify-center items-center rounded-lg border border-[#EFC8CB] bg-[#FAE8E8] text-[#A83F49] text-[10px] font-extrabold hover:bg-[#f6dbdb] active:scale-[0.98] transition-all"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ================= MODAL: CREATE / EDIT BARANG ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#DCE6DF] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8EDE9] flex items-center justify-between bg-[#F8FAF9]">
              <div>
                <h3 className="text-base font-bold text-[#1F2A24]">
                  {modalMode === "create" ? "Tambah Barang Baru" : "Edit Data Barang"}
                </h3>
                <p className="text-[11px] text-[#66736C]">
                  {modalMode === "create"
                    ? "Masukkan rincian barang untuk ditambahkan ke daftar kurasi."
                    : "Perbarui informasi barang yang sudah terdaftar."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.barang}
                  onChange={(e) => setFormData({ ...formData, barang: e.target.value })}
                  placeholder="Contoh: Meja Belajar Kayu Jati"
                  className="w-full h-10 px-3 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B]"
                />
              </div>

              {/* Pemilik */}
              <div>
                <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                  Nama Pemilik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pemilik}
                  onChange={(e) => setFormData({ ...formData, pemilik: e.target.value })}
                  placeholder="Contoh: Nadia Rahma"
                  className="w-full h-10 px-3 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B]"
                />
              </div>

              {/* Grid: Jenis & Status Kurasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                    Jenis Barang
                  </label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B]"
                  >
                    <option value="Donasi">Donasi</option>
                    <option value="Lelang">Lelang</option>
                    <option value="Jual">Jual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                    Status Kurasi
                  </label>
                  <select
                    value={formData.kurasi}
                    onChange={(e) => setFormData({ ...formData, kurasi: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#DCE6DF] bg-white text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B]"
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Ditinjau">Ditinjau</option>
                    <option value="Dilaporkan">Dilaporkan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Kondisi Barang */}
              <div>
                <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                  Kondisi Barang
                </label>
                <input
                  type="text"
                  value={formData.kondisi}
                  onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                  placeholder="Contoh: Kondisi baik, ada gores halus"
                  className="w-full h-10 px-3 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B]"
                />
              </div>

              {/* Pilihan Gambar (Upload Komputer Lokal / Preset / URL) */}
              <div>
                <label className="block text-xs font-bold text-[#1F2A24] mb-1.5">
                  Foto Barang
                </label>

                {/* Box Upload dari Komputer & Preview */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-[#DCE6DF] bg-[#F8FAF9] mb-3">
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-white border border-[#DCE6DF] shrink-0 relative group shadow-2xs">
                    <img
                      src={formData.image || "/ImageMejaBelajarKayu.png"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/ImageMejaBelajarKayu.png";
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="upload-foto-barang"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F7D5B] text-white text-xs font-bold hover:bg-[#25664a] active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Upload</span>
                    </label>
                    <input
                      id="upload-foto-barang"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {uploadFileName ? (
                      <p className="text-[11px] text-[#2F7D5B] font-semibold mt-1 truncate max-w-[240px]">
                        ✓ {uploadFileName}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#66736C] mt-1">
                        Pilih foto langsung dari komputer Anda (JPG, PNG, WEBP)
                      </p>
                    )}
                  </div>
                </div>

                {/* Preset Gambar Cepat
                 <div className="mb-2">
                  <span className="text-[10px] font-semibold text-[#66736C] block mb-1">
                    Atau gunakan gambar contoh:
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: preset.url });
                          setUploadFileName("");
                        }}
                        className={`flex flex-col items-center p-1 rounded-lg border text-[9px] shrink-0 cursor-pointer transition-all ${
                          formData.image === preset.url
                            ? "border-[#2F7D5B] bg-[#E5F2EB] font-bold text-[#1F6044]"
                            : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-12 h-9 rounded object-cover mb-1"
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Input URL Alternatif */}
                {/* <input
                  type="text"
                  value={formData.image.startsWith("data:") ? "" : formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setUploadFileName("");
                  }}
                  placeholder={
                    formData.image.startsWith("data:")
                      ? "Gambar diupload dari komputer (Data URL aktif)"
                      : "Atau masukkan URL gambar..."
                  }
                  className="w-full h-8 px-3 rounded-lg border border-[#DCE6DF] text-[11px] text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B]"
                /> */}
              </div> 

              {/* Catatan Kurasi */}
              <div>
                <label className="block text-xs font-bold text-[#1F2A24] mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan awal verifikasi untuk pemilik..."
                  className="w-full p-2.5 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] resize-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-[#E8EDE9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2F7D5B] text-white text-xs font-bold hover:bg-[#25664a] shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  {modalMode === "create" ? "Simpan Barang" : "Perbarui Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#DCE6DF] shadow-2xl w-full max-w-sm p-6 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              ✕
            </div>
            <h4 className="text-base font-bold text-[#1F2A24] mb-1">
              Hapus Barang Ini?
            </h4>
            <p className="text-xs text-[#66736C] mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus{" "}
              <strong className="text-[#1F2A24]">
                "{itemToDelete.barang}"
              </strong>{" "}
              milik <span className="font-semibold">{itemToDelete.pemilik}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}