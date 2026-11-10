import React, { useState } from "react";

export default function HalamanChat({ product, onBack, onNavigate, onLogout }) {
  const item = product || {
    title: "Sepeda Kota Vintage",
    priceText: "Rp750.000",
    image: "/images/vintage-bike.jpg",
  };

  const [activeChatId, setActiveChatId] = useState(1);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "me",
      text: "Halo Kak, apakah sepeda ini masih tersedia?",
      time: "10:18",
    },
    {
      id: 2,
      sender: "them",
      text: "Masih, Kak. Kondisinya sesuai foto dan siap dicek 😸.",
      time: "10:21",
    },
    {
      id: 3,
      sender: "me",
      text: "Boleh COD di area Taman Bungkul besok?",
      time: "10:24",
    },
  ]);

  const conversations = [
    {
      id: 1,
      name: "Budi Santoso",
      avatar: "BS",
      lastMessage: messages[messages.length - 1]?.text || "Boleh COD di area...",
      time: "10:24",
      active: activeChatId === 1,
    },
    {
      id: 2,
      name: "Nadia Rahma",
      avatar: "NR",
      lastMessage: "Terima kasih, Kak",
      time: "Kemarin",
      active: activeChatId === 2,
    },
    {
      id: 3,
      name: "Yayasan Peduli",
      avatar: "YP",
      lastMessage: "Terima kasih, Kak",
      time: "Kemarin",
      active: activeChatId === 3,
    },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "me",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate quick seller response
    setTimeout(() => {
      const sellerReplies = [
        "Baik Kak, jam berapa kira-kira bisanya?",
        "Siap, besok saya bawa sepedanya ke Taman Bungkul.",
        "Oke Kak, sampai ketemu besok ya!",
      ];
      const randomReply = sellerReplies[Math.floor(Math.random() * sellerReplies.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "them",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  const handleQuickAction = (text) => {
    setInputText(text);
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-plusJakartaSans text-[#1F2A24] flex flex-col justify-between">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Kembali ke beranda"
          >
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px] transition-transform group-hover:scale-105">
              <span className="text-[#FFF] text-[19px] font-extrabold leading-none tracking-[-0.0368em]">
                T
              </span>
            </div>
            <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-[-0.0333em]">
              TradeMe
            </span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#1F2A24] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1">
        {/* Eyebrow & Title */}
        <p className="text-[#2F7D5B] text-[11px] font-extrabold leading-[16.5px] tracking-[0.1636em] uppercase mb-1.5">
          Pesan
        </p>
        <h1 className="text-3xl sm:text-[36px] font-bold text-[#1F2A24] leading-tight tracking-[-0.025em] mb-6">
          Chat
        </h1>

        {/* 2-Column Chat Box */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[580px]">
          {/* ================= LEFT COLUMN: CONVERSATION LIST ================= */}
          <div className="w-full md:w-[320px] lg:w-[360px] border-b md:border-b-0 md:border-r border-[#E2E8F0] p-4 flex flex-col bg-[#FDFEFE]">
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Cari percakapan"
                className="w-full h-[42px] pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#1F2A24] placeholder:text-[#718096] focus:outline-none focus:border-[#2F7D5B]"
              />
              <svg
                className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Conversation Items */}
            <div className="flex flex-col gap-2 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChatId(c.id)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                    c.active
                      ? "bg-[#EAF5EF] border border-[#D5E5DC]"
                      : "bg-white hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        c.active
                          ? "bg-[#D2E7DA] text-[#2F7D5B]"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-[#1F2A24] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">
                        {c.lastMessage}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#718096] shrink-0 ml-2">
                    {c.time}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ACTIVE CHAT ROOM ================= */}
          <div className="flex-1 flex flex-col justify-between bg-white p-4 sm:p-6 min-h-[460px]">
            {/* Chat Room Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEFEA]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF5EF] text-[#2F7D5B] font-bold text-sm flex items-center justify-center">
                    BS
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1F2A24]">Budi Santoso</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#2F7D5B]">
                      <span className="w-2 h-2 rounded-full bg-[#2F7D5B]"></span>
                      <span>Aktif sekarang</span>
                    </div>
                  </div>
                </div>

                {/* View Product CTA */}
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate("detail", { product: item })}
                  className="px-4 py-1.5 rounded-xl border border-[#DCE6DF] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2A24] transition-colors focus:outline-none"
                >
                  Lihat Barang
                </button>
              </div>

              {/* Product Preview Bar */}
              <div
                onClick={() => onNavigate && onNavigate("detail", { product: item })}
                className="mt-3.5 bg-[#F6FAF7] border border-[#E8EEEA] rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer hover:border-[#2F7D5B]/40 transition-colors"
              >
                <img
                  src={item.image || "/images/vintage-bike.jpg"}
                  alt={item.title}
                  className="w-11 h-11 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-[#1F2A24] truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs font-extrabold text-[#2F7D5B] mt-0.5">
                    {item.priceText || "Rp750.000"}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#2F7D5B] px-2">&rarr;</span>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="my-6 space-y-4 max-h-[340px] overflow-y-auto px-1">
              {messages.map((m) => {
                const isMe = m.sender === "me";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-[#2F7D5B] text-white rounded-tr-xs"
                          : "bg-white border border-[#E2E8F0] text-[#1F2A24] rounded-tl-xs"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-[#718096] mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions & Input */}
            <div>
              {/* Quick Actions Chips */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleQuickAction("Bisa COD di area mana saja Kak?")}
                  className="px-3 py-1.5 rounded-full border border-[#DCE6DF] bg-white hover:bg-gray-50 text-[11px] font-medium text-[#1F2A24] whitespace-nowrap flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>Tentukan titik COD</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAction("Apakah harga masih bisa dinego?")}
                  className="px-3 py-1.5 rounded-full border border-[#DCE6DF] bg-white hover:bg-gray-50 text-[11px] font-medium text-[#1F2A24] whitespace-nowrap transition-colors"
                >
                  Ajukan penawaran
                </button>
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="flex-1 h-[46px] px-4 rounded-xl border border-[#DCE6DF] text-xs text-[#1F2A24] placeholder:text-[#718096] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/15"
                />

                <button
                  type="submit"
                  className="h-[46px] px-5 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Kirim</span>
                  <span>&rarr;</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E8EEEA] bg-white pt-8 pb-10 mt-12">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] shadow-[0_6px_16px_rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold leading-none">
                  T
                </span>
              </div>
              <span className="text-[#1F2A24] text-[20px] font-extrabold tracking-tight">
                TradeMe
              </span>
              <span className="text-sm text-[#718096] hidden md:inline ml-3">
                Memberi nilai baru pada barang lama.
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Donasi
              </button>
              <button
                type="button"
                onClick={onBack}
                className="hover:text-[#2F7D5B] transition-colors focus:outline-none"
              >
                Profil
              </button>
              <button
                type="button"
                onClick={() => onLogout && onLogout()}
                className="hover:text-red-600 transition-colors focus:outline-none"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8A948E] pt-2 border-t border-[#F0F4F1]">
            © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
          </div>
        </div>
      </footer>
    </div>
  );
}

