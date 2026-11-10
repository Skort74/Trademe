import React from 'react';

const PopupSuksesDonasi = ({ recipientName, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center border border-gray-100 transform transition-all scale-100">
        
        {/* Icon Sukses */}
        <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#2F7D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Judul & Pesan */}
        <h2 className="text-2xl font-bold text-[#1F2A24] mb-3">Donasi Berhasil Disalurkan!</h2>
        <p className="text-[#718096] mb-6 leading-relaxed">
          Terima kasih atas kebaikan hatimu. Barang donasimu akan segera diteruskan kepada <strong className="text-[#2F7D5B]">{recipientName}</strong>. 
          Satu barang bekas bagimu, bisa menjadi harapan baru bagi mereka.
        </p>

        {/* Info Tambahan (Opsional) */}
        <div className="bg-[#F8FAF9] rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#2F7D5B] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#516057]">
              Kamu akan menerima notifikasi ketika penerima telah mengonfirmasi penerimaan barang ini.
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-[#2F7D5B] text-white font-bold rounded-xl hover:bg-[#25664a] transition-colors shadow-md shadow-[#2F7D5B]/20"
          >
            Kembali ke Mulai Berdonasi
          </button>
          
          <button 
            onClick={onClose} // Bisa diarahkan ke Home jika mau
            className="w-full py-3.5 text-[#718096] font-semibold hover:text-[#1F2A24] transition-colors text-sm"
          >
            Lihat riwayat donasiku
          </button>
        </div>

      </div>
    </div>
  );
};

export default PopupSuksesDonasi;