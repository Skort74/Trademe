import React, { useState, useRef } from 'react';

const HalamanAjukanTukar = ({ product, onBack, onNavigate }) => {
  const [pesan, setPesan] = useState('');
  const [manualNamaBarang, setManualNamaBarang] = useState('');
  const [manualDeskripsi, setManualDeskripsi] = useState('');
  const [manualKondisi, setManualKondisi] = useState('Baik');
  const [previewImage, setPreviewImage] = useState(null);
  
  // State Lokasi (Ketik & Hasil Konfirmasi)
  const [inputLokasi, setInputLokasi] = useState('');
  const [lokasiTerkonfirmasi, setLokasiTerkonfirmasi] = useState('');

  // State untuk Pop-up Sukses
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const defaultProduct = {
    nama: 'Meja Makan Kayu Jati',
    kondisi: 'Sangat baik',
    deskripsi: 'Meja makan kayu jati solid, usia 5 tahun. Masih sangat layak pakai.',
    lokasi: 'Rungkut, Surabaya',
    pemilik: 'Budi Santoso',
    foto: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=400&q=80' 
  };

  const barangTarget = {
    ...defaultProduct,       
    ...(product || {}),      
    nama: product?.nama || product?.title || defaultProduct.nama,
    foto: product?.foto || product?.image || defaultProduct.foto,
    pemilik: product?.pemilik || product?.seller || defaultProduct.pemilik,
    lokasi: product?.lokasi || product?.location || defaultProduct.lokasi,
    kondisi: product?.kondisi || product?.condition || defaultProduct.kondisi,
    deskripsi: product?.deskripsi || product?.description || defaultProduct.deskripsi
  };

  // -- LOGIKA UPLOAD --
  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      alert("Mohon unggah file gambar.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    setPreviewImage(null);
  };

  const openFileExplorer = (e) => {
    e.preventDefault();
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // -- LOGIKA MAPS & VALIDASI --
  const handleKonfirmasiLokasi = (e) => {
    e.preventDefault();
    if (!inputLokasi.trim()) {
      alert("Silakan ketik nama lokasi terlebih dahulu.");
      return;
    }
    setLokasiTerkonfirmasi(inputLokasi);
    alert("Lokasi berhasil dikunci!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!previewImage) {
      alert("Silakan unggah foto barangmu terlebih dahulu.");
      return;
    }
    if (!lokasiTerkonfirmasi) {
      alert("Silakan cari dan klik 'Gunakan Lokasi Ini' pada peta terlebih dahulu.");
      return;
    }
    
    // Di sini Anda bisa menambahkan logika untuk mengirim data ke API/Backend nanti
    // const dataAjuan = { ... };
    // console.log("Data berhasil disubmit:", dataAjuan);

    // Tampilkan Pop-up Sukses
    setIsSuccess(true);
  };

  // URL Google Maps untuk Iframe
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(inputLokasi || 'Surabaya')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-8 px-4 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8">
          <button onClick={onBack} type="button" className="text-sm font-semibold text-[#2F7D5B] hover:text-[#25684B] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Kembali ke beranda
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-2">Ajukan Tukar Barang</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* KARTU BARANG TARGET */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="bg-[#EAF5EF] text-[#2F7D5B] text-xs font-bold px-3 py-1 rounded-full uppercase">Tukar</span>
              <h3 className="font-bold text-gray-800">Barang yang ingin kamu tukar</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                <img src={barangTarget.foto} alt={barangTarget.nama} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-1">{barangTarget.nama}</h4>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mb-2 inline-block">Kondisi: {barangTarget.kondisi}</span>
                <p className="text-sm text-gray-600 mb-4">{barangTarget.deskripsi}</p>
                <div className="flex items-center gap-3 border-t pt-3 border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center text-xs font-bold">BS</div>
                  <div>
                    <p className="text-xs font-bold">{barangTarget.pemilik}</p>
                    <p className="text-[11px] text-gray-500">📍 {barangTarget.lokasi}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KARTU DETAIL BARANG (UPLOAD) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Detail Barangmu</h3>
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Foto Barang <span className="text-red-500">*</span></label>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

                {!previewImage ? (
                  <div onClick={openFileExplorer} onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 hover:border-[#2F7D5B] rounded-2xl bg-[#FAFAFA] cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#EAF5EF] text-[#2F7D5B] flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-700"><span className="text-[#2F7D5B]">Klik untuk upload foto</span> atau drag & drop</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 border-2 border-dashed border-[#2F7D5B]/50 rounded-2xl bg-[#F8FAF9]">
                    <div className="w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-4">
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onMouseDown={openFileExplorer} className="px-5 py-2.5 bg-white border border-[#2F7D5B] text-[#2F7D5B] rounded-xl text-sm font-semibold hover:bg-[#2F7D5B] hover:text-white transition-all cursor-pointer">
                        Ganti Gambar
                      </button>
                      <button type="button" onClick={handleRemoveImage} className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 cursor-pointer">
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                <input type="text" value={manualNamaBarang} onChange={(e) => setManualNamaBarang(e.target.value)} placeholder="Contoh: Meja Belajar Minimalis" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#2F7D5B]" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kondisi Barang <span className="text-red-500">*</span></label>
                <select value={manualKondisi} onChange={(e) => setManualKondisi(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#2F7D5B] bg-white cursor-pointer">
                  <option value="Sangat baik">Sangat Baik (Seperti baru)</option>
                  <option value="Baik">Baik (Ada sedikit tanda pemakaian normal)</option>
                  <option value="Cukup">Cukup (Fungsi aman, ada lecet/bekas pakai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat <span className="text-red-500">*</span></label>
                <textarea value={manualDeskripsi} onChange={(e) => setManualDeskripsi(e.target.value)} placeholder="Jelaskan kondisi barang..." className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#2F7D5B] resize-none" rows="3" required />
              </div>
            </div>
          </div>

          {/* KARTU LOKASI PERTEMUAN (MAPS & VALIDASI) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-1">Lokasi Pertemuan (COD)</h3>
            <p className="text-xs text-gray-500 mb-3">Ketik nama tempat, lalu klik "Gunakan Lokasi Ini" untuk mengunci titik temu.</p>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Contoh: Taman Bungkul Surabaya" 
                value={inputLokasi} 
                onChange={(e) => setInputLokasi(e.target.value)} 
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#2F7D5B]" 
              />
              <button 
                type="button" 
                onClick={handleKonfirmasiLokasi}
                className="px-5 py-2.5 bg-[#EAF5EF] text-[#2F7D5B] border border-[#2F7D5B] rounded-xl font-bold text-sm hover:bg-[#2F7D5B] hover:text-white transition-colors"
              >
                Gunakan Lokasi Ini
              </button>
            </div>

            {lokasiTerkonfirmasi && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-sm font-semibold">
                <span>✅</span> Lokasi Terpilih: {lokasiTerkonfirmasi}
              </div>
            )}

            <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <iframe 
                title="Peta Lokasi"
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-[11px] text-center text-gray-400 mt-2">Geser peta atau ganti teks di atas untuk mencari titik temu.</p>
          </div>

          {/* PESAN */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-1">Pesan Tambahan (Opsional)</h3>
            <textarea placeholder="Halo Mas Budi, saya tertarik menukar meja saya..." value={pesan} onChange={(e) => setPesan(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#2F7D5B] resize-none" rows="2" />
          </div>

          <button type="submit" className="w-full bg-[#2F7D5B] hover:bg-[#25684B] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
            Kirim Pengajuan Tukar
          </button>
        </form>
      </div>

      {/* POP-UP SUKSES (MODAL) */}
      {isSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 transform transition-all">
            <div className="w-16 h-16 bg-[#EAF5EF] text-[#2F7D5B] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pengajuan Terkirim!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Pengajuan tukar barang Anda telah berhasil dikirim ke penjual. Silakan cek menu pesan nanti untuk melihat balasannya.
            </p>
            <button 
              onClick={() => {
                setIsSuccess(false);
                if (onNavigate) onNavigate('home'); // Kembali ke beranda
              }}
              className="w-full bg-[#2F7D5B] hover:bg-[#25684B] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HalamanAjukanTukar;