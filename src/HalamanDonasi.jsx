import React, { useState, useEffect, useCallback, useRef } from 'react';
import HalamanUnggahDonasi from './HalamanUnggahDonasi';
import AjukanPenerima from "./AjukanPenerima";
import BackButton from './components/BackButton';
import { foundations, recipientApplications, STORE_EVENT } from './utils/adminStore';
import { getConversationsForUser, countUnread } from './utils/chat';

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// Data Lokal Yayasan Mitra Bawaan
const DEFAULT_YAYASAN = [
  {
    id: 1,
    name: 'Yayasan Kasih Anak',
    needs: 'Buku pelajaran, seragam sekolah, mainan edukatif',
    location: 'Gubeng, Surabaya',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    name: 'Panti Asuhan Harapan',
    needs: 'Peralatan dapur, selimut, pakaian layak pakai',
    location: 'Wonokromo, Surabaya',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'Rumah Singgah Mandiri',
    needs: 'Furnitur bekas, elektronik fungsional, bahan bangunan',
    location: 'Rungkut, Surabaya',
    image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=400&q=80'
  }
];

// Data Lokal Penerima Perorangan Bawaan
const DEFAULT_PERORANGAN = [
  {
    id: 4,
    name: 'Siti Aminah',
    needs: 'Buku, meja belajar, pakaian anak',
    location: 'Sukolilo, Surabaya',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 5,
    name: 'Pak Hasan',
    needs: 'Peralatan rumah tangga',
    location: 'Rungkut, Surabaya',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 6,
    name: 'Keluarga Ibu Ratna',
    needs: 'Furnitur dan elektronik',
    location: 'Tegalsari, Surabaya',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80'
  }
];

const HalamanDonasi = ({ onBack, onGoBack, onNavigate, currentUser, onLogout }) => {
  // State untuk mengontrol tampilan (List Penerima vs Form Unggah)
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // State untuk Filter (yayasan / perorangan)
  const [activeTab, setActiveTab] = useState('yayasan');
  const [showForm, setShowForm] = useState(false);
  const recipientsRef = useRef(null);

  // Render ulang saat data yayasan / pengajuan berubah (mis. disetujui admin di tab lain)
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener(STORE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(STORE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  // Yayasan mitra yang aktif (gabungan dari data admin store + data lokal)
  const adminFoundations = foundations
    ? foundations.all().filter((y) => y.status === 'Aktif').map((y) => ({
        id: y.id,
        name: y.name,
        needs: y.needs || y.description || 'Menerima berbagai barang layak pakai',
        location: y.location,
        image: y.image || null,
      }))
    : [];

  const recipientsYayasan = adminFoundations.length > 0
    ? [...adminFoundations, ...DEFAULT_YAYASAN.filter((d) => !adminFoundations.some((a) => a.name === d.name))]
    : DEFAULT_YAYASAN;

  // Penerima perorangan yang sudah disetujui
  const adminPerorangan = recipientApplications
    ? recipientApplications.all()
        .filter((a) => a.tipe_penerima === 'perorangan' && a.status === 'Disetujui')
        .map((a) => ({
          id: a.id,
          name: a.applicantName || 'Penerima perorangan',
          needs: a.alasan_kebutuhan,
          location: a.lokasi,
          image: a.image || null,
        }))
    : [];

  const recipientsPerorangan = adminPerorangan.length > 0
    ? [...adminPerorangan, ...DEFAULT_PERORANGAN.filter((d) => !adminPerorangan.some((a) => a.name === d.name))]
    : DEFAULT_PERORANGAN;

  // Pilih data berdasarkan tab aktif
  const currentRecipients = activeTab === 'yayasan' ? recipientsYayasan : recipientsPerorangan;

  // Titik merah di ikon chat hanya jika ada pesan belum dibaca
  const hasUnreadChat =
    !!currentUser &&
    getConversationsForUser(currentUser).some((c) => countUnread(c, currentUser.username) > 0);

  // Handler saat tombol Donasikan diklik
  const handleDonateClick = (recipient) => {
    setSelectedRecipient(recipient);
    setShowUploadForm(true);
  };

  // Jika sedang mode upload form, render komponen HalamanUnggahDonasi
  if (showUploadForm && selectedRecipient) {
    return (
      <HalamanUnggahDonasi 
        onBack={() => {
          setShowUploadForm(false);
          setSelectedRecipient(null);
        }}
        recipientName={selectedRecipient.name}
        recipientType={activeTab} // Kirim tipe 'yayasan' atau 'perorangan'
        onHome={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans text-[#1F2A24]">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-[#EAEFEA] bg-white sticky top-0 z-40">
        <div className="max-w-[1320px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={onGoBack} />
            <button onClick={onBack} className="flex items-center gap-2.5 group focus:outline-none">
              <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] w-[35px] h-[35px]">
                <span className="text-[#FFF] text-[19px] font-extrabold">T</span>
              </div>
              <span className="text-[#1F2A24] text-[21px] font-extrabold tracking-tight">TradeMe</span>
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" 
              placeholder="Cari barang di Surabaya..." 
              className="w-full py-2.5 pl-10 pr-4 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#2F7D5B]"
            />
            <svg className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate && onNavigate('unggah')} className="bg-[#2F7D5B] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#25664a] transition-colors">
              + Unggah Barang
            </button>
            <button onClick={() => onNavigate && onNavigate('chat')} className="relative p-2 text-[#1F2A24]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              {hasUnreadChat && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2F7D5B] text-xs font-bold flex items-center justify-center">
                  {initials(currentUser.fullName || currentUser.username)}
                </span>
                <span className="hidden sm:inline">{currentUser.fullName || currentUser.username}</span>
              </div>
            ) : (
              <button onClick={() => onNavigate && onNavigate('login')} className="font-semibold text-sm text-[#2F7D5B]">
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="bg-[#F0F7F4] py-16 sm:py-24">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#2F7D5B] font-bold text-xs tracking-widest uppercase mb-4 block">DONASI TERVERIFIKASI</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1F2A24] leading-tight mb-6">
              Barang sederhana,<br/>dampak luar biasa.
            </h1>
            <p className="text-lg text-[#516057] mb-8 leading-relaxed max-w-lg">
              Salurkan barang layak pakai kepada yayasan dan penerima yang telah diverifikasi oleh tim TradeMe.
            </p>
            <button
              onClick={() => recipientsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#2F7D5B] text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-[#25664a] transition-all shadow-lg shadow-[#2F7D5B]/20">
              Mulai Berdonasi Sekarang
            </button>
          </div>
          <div className="relative h-[400px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80" 
              alt="Volunteer Donation" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ================= RECIPIENTS SECTION ================= */}
      <section ref={recipientsRef} className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[#2F7D5B] font-bold text-xs tracking-widest uppercase mb-2 block">PENERIMA TERVERIFIKASI</span>
              <h2 className="text-3xl font-bold text-[#1F2A24]">Pilih tujuan donasimu</h2>
            </div>
            
            {/* FILTER TABS */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
              <button 
                onClick={() => setActiveTab('yayasan')}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                  activeTab === 'yayasan' 
                    ? 'bg-[#2F7D5B] text-white shadow-sm' 
                    : 'text-[#516057] hover:bg-gray-200'
                }`}
              >
                Yayasan Mitra
              </button>
              <button 
                onClick={() => setActiveTab('perorangan')}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                  activeTab === 'perorangan' 
                    ? 'bg-[#2F7D5B] text-white shadow-sm' 
                    : 'text-[#516057] hover:bg-gray-200'
                }`}
              >
                Penerima Perorangan
              </button>
            </div>
          </div>

          {currentRecipients.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D5E5DC] bg-[#F8FBF9] py-14 px-6 text-center">
              <p className="text-lg font-bold text-[#1F2A24] mb-1">
                Belum ada {activeTab === 'yayasan' ? 'yayasan mitra' : 'penerima perorangan'} yang terverifikasi
              </p>
              <p className="text-sm text-[#718096] mb-5">
                Penerima akan tampil di sini setelah diverifikasi oleh tim TradeMe.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2.5 rounded-xl border-2 border-[#1F2A24] text-[#1F2A24] font-bold text-sm hover:bg-[#1F2A24] hover:text-white transition-all"
              >
                Ajukan Sebagai Penerima →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentRecipients.map((recipient) => (
              <div key={recipient.id} className="bg-white rounded-2xl border border-[#EAEFEA] overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
                {recipient.image ? (
                  <div className="h-44 overflow-hidden bg-gray-100">
                    <img
                      src={recipient.image}
                      alt={recipient.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-[#E8F5E9] to-[#D2E7DA] flex items-center justify-center">
                    <span className="w-16 h-16 rounded-full bg-white/80 text-[#2F7D5B] text-xl font-extrabold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {initials(recipient.name)}
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span className="text-[#2F7D5B] text-xs font-bold uppercase tracking-wide">Terverifikasi</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1F2A24] mb-2">{recipient.name}</h3>
                  <p className="text-sm text-[#718096] mb-4 line-clamp-2 flex-1">{recipient.needs}</p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-6">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {recipient.location}
                  </div>

                  <button 
                    onClick={() => handleDonateClick(recipient)}
                    className="w-full py-3 rounded-xl bg-[#2F7D5B] text-white font-bold text-sm hover:bg-[#25664a] transition-colors mt-auto"
                  >
                    Donasikan Barang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA pendaftaran hanya untuk penerima perorangan */}
      {activeTab === 'perorangan' && (
      <section className="bg-[#FFF9EB] py-16">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-[#B45309] font-bold text-xs tracking-widest uppercase mb-2 block">KENAL SESEORANG YANG MEMBUTUHKAN?</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2A24] mb-2">Daftarkan mereka yang membutuhkan</h2>
            <p className="text-[#718096] text-sm">Data calon penerima akan diperiksa oleh admin sebelum ditampilkan agar bantuan tepat sasaran.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-3.5 rounded-xl border-2 border-[#1F2A24] text-[#1F2A24] font-bold text-sm hover:bg-[#1F2A24] hover:text-white transition-all whitespace-nowrap"
>
            Daftarkan Penerima →
        </button>
        </div>
      </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E8EEEA] pt-10 pb-8 mt-12">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-[11px] bg-[#2F7D5B] w-[35px] h-[35px]">
              <span className="text-[#FFF] text-[19px] font-extrabold">T</span>
            </div>
            <span className="text-[#1F2A24] text-[20px] font-extrabold">TradeMe</span>
            <span className="text-sm text-[#718096] hidden md:inline ml-3">Memberi nilai baru pada barang lama.</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-[#516057]">
            <button onClick={onBack} className="hover:text-[#2F7D5B]">Beranda</button>
            <button onClick={() => onNavigate && onNavigate('chat')} className="hover:text-[#2F7D5B]">Chat</button>
            <button onClick={onLogout} className="hover:text-red-600">Keluar</button>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 mt-6 pt-4 border-t border-[#F0F4F1] text-xs text-[#8A948E]">
          © {new Date().getFullYear()} TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
        </div>
      </footer>
      {showForm && (
        <AjukanPenerima
          recipientType="perorangan"
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default HalamanDonasi;
