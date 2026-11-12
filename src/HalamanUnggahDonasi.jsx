import React, { useState, useRef } from 'react';
import PopupSuksesDonasi from './PopupSuksesDonasi';

const MAX_PHOTOS = 5;

const HalamanUnggahDonasi = ({ onBack, recipientName, recipientType }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [photos, setPhotos] = useState([]); // foto barang yang dipilih
  const [penerima, setPenerima] = useState(recipientName || ''); // terisi dari kartu, boleh diubah
  const fileRef = useRef(null);
  const [formData, setFormData] = useState({
    namaBarang: '',
    kategori: '',
    kondisi: '',
    deskripsi: '',
    lokasi: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tambah foto (maksimal 5, hanya JPG/PNG)
  const addPhotos = (e) => {
    const picked = Array.from(e.target.files).filter((f) => /^image\/(jpe?g|png)$/.test(f.type));
    const room = MAX_PHOTOS - photos.length;
    const added = picked.slice(0, room).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  // Hapus satu foto
  const removePhoto = (id) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Tampilkan popup sukses
    setIsSuccess(true);
  };

  // Jika sukses, tampilkan popup
  if (isSuccess) {
    return (
      <PopupSuksesDonasi 
        recipientName={penerima || 'Yayasan Mitra'} 
        onClose={() => onBack && onBack()} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans text-[#1F2A24]">
      {/* Header Sederhana */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#2F7D5B] font-bold hover:underline">
            ← Kembali
          </button>
          <span className="font-extrabold text-xl tracking-tight">TradeMe</span>
          <div className="w-20"></div> {/* Spacer agar logo tengah */}
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-12">
        {/* Judul Halaman */}
        <div className="mb-10 text-center">
          <span className="text-[#2F7D5B] font-bold text-xs tracking-widest uppercase mb-2 block">BERIKAN KESEMPATAN KEDUA</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2A24] mb-3">Unggah barang donasi</h1>
          <p className="text-[#718096]">Lengkapi informasi agar barangmu mudah ditemukan oleh {recipientType === 'perorangan' ? 'penerima' : 'yayasan'}.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN 1: PILIH JENIS TRANSAKSI (HANYA DONASI) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h3 className="font-bold text-lg">Pilih jenis transaksi</h3>
                <p className="text-xs text-gray-500">Apa yang ingin kamu lakukan?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Opsi Jual (Disabled/Greyed Out) */}
              <div className="border border-gray-200 rounded-xl p-4 opacity-50 cursor-not-allowed bg-gray-50">
                <span className="inline-block px-2 py-1 rounded-md bg-gray-200 text-gray-500 text-xs font-bold mb-2">Jual</span>
                <p className="font-bold text-gray-500">Jual</p>
                <p className="text-xs text-gray-400">Tetapkan harga barang</p>
              </div>
              
              {/* Opsi Tukar (Disabled/Greyed Out) */}
              <div className="border border-gray-200 rounded-xl p-4 opacity-50 cursor-not-allowed bg-gray-50">
                <span className="inline-block px-2 py-1 rounded-md bg-gray-200 text-gray-500 text-xs font-bold mb-2">Tukar</span>
                <p className="font-bold text-gray-500">Tukar</p>
                <p className="text-xs text-gray-400">Tukar dengan barang lain</p>
              </div>

              {/* Opsi Lelang (Disabled/Greyed Out) */}
              <div className="border border-gray-200 rounded-xl p-4 opacity-50 cursor-not-allowed bg-gray-50">
                <span className="inline-block px-2 py-1 rounded-md bg-gray-200 text-gray-500 text-xs font-bold mb-2">Lelang</span>
                <p className="font-bold text-gray-500">Lelang</p>
                <p className="text-xs text-gray-400">Terima tawaran terbaik</p>
              </div>

              {/* Opsi DONASI (ACTIVE & SELECTED) */}
              <div className="border-2 border-[#2F7D5B] rounded-xl p-4 bg-[#F0FDF4] relative">
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#2F7D5B] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span className="inline-block px-2 py-1 rounded-md bg-[#DCFCE7] text-[#166534] text-xs font-bold mb-2">Donasi</span>
                <p className="font-bold text-[#1F2A24]">Donasi</p>
                <p className="text-xs text-[#516057]">Berikan secara gratis</p>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: ISI DETAIL BARANG */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#2F7D5B] text-white flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h3 className="font-bold text-lg">Isi detail barang</h3>
                <p className="text-xs text-gray-500">Berikan informasi yang jelas dan jujur</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kolom Kiri: Upload Foto */}
              <div
                onClick={() => {
                  if (photos.length === 0) fileRef.current.click();
                }}
                className={`border-2 border-dashed border-[#2F7D5B]/30 rounded-xl bg-[#F8FAF9] flex flex-col items-center justify-center text-center transition-colors group ${
                  photos.length === 0 ? 'p-8 cursor-pointer hover:bg-[#F0FDF4]' : 'p-4'
                }`}
              >
                {/* Input file tersembunyi */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={addPhotos}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                />

                {photos.length === 0 ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#2F7D5B] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <p className="font-bold text-[#1F2A24] mb-1">Tambahkan foto barang</p>
                    <p className="text-xs text-gray-500 mb-4">Unggah hingga 5 foto, format JPG atau PNG</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileRef.current.click();
                      }}
                      className="px-4 py-2 border border-[#2F7D5B] text-[#2F7D5B] rounded-lg text-sm font-bold hover:bg-[#2F7D5B] hover:text-white transition-colors"
                    >
                      Pilih Foto
                    </button>
                  </>
                ) : (
                  <div className="w-full">
                    {/* Foto pertama tampil besar, sisanya 2 kolom di bawahnya */}
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((p, i) => (
                        <div
                          key={p.id}
                          className={`relative overflow-hidden rounded-xl bg-white ${
                            i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'
                          }`}
                        >
                          <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(p.id)}
                            aria-label={`Hapus ${p.file.name}`}
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F2A24]/80 text-xs text-white hover:bg-[#1F2A24]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={photos.length >= MAX_PHOTOS}
                      onClick={() => fileRef.current.click()}
                      className="mt-3 px-4 py-2 border border-[#2F7D5B] text-[#2F7D5B] rounded-lg text-sm font-bold hover:bg-[#2F7D5B] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#2F7D5B]"
                    >
                      {photos.length >= MAX_PHOTOS ? 'Maksimal 5 foto' : `Tambah Foto (${photos.length}/${MAX_PHOTOS})`}
                    </button>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Form Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">Nama barang</label>
                  <input 
                    type="text" 
                    name="namaBarang"
                    placeholder="Contoh: Sepeda kota vintage" 
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] focus:ring-1 focus:ring-[#2F7D5B] outline-none transition-all"
                    value={formData.namaBarang}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">Kategori</label>
                    <select 
                      name="kategori"
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] outline-none bg-white"
                      value={formData.kategori}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Pilih kategori</option>
                      <option value="elektronik">Elektronik</option>
                      <option value="fashion">Fashion</option>
                      <option value="furniture">Furniture</option>
                      <option value="buku">Buku & Alat Tulis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">Kondisi</label>
                    <select 
                      name="kondisi"
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] outline-none bg-white"
                      value={formData.kondisi}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Pilih kondisi</option>
                      <option value="baru">Baru</option>
                      <option value="bekas_baik">Bekas - Baik</option>
                      <option value="bekas_cukup">Bekas - Cukup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">Deskripsi</label>
                  <textarea 
                    name="deskripsi"
                    placeholder="Ceritakan kondisi, ukuran, kelengkapan, dan kekurangan barang" 
                    rows="3"
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] outline-none resize-none"
                    value={formData.deskripsi}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                {/* Field Khusus Donasi: Penerima */}
                <div>
                  <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">
                    {recipientType === 'perorangan' ? 'Penerima donasi' : 'Yayasan penerima'}
                  </label>
                  <input 
                    type="text" 
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    placeholder="Nama penerima"
                    required
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Terisi otomatis dari kartu yang dipilih, boleh diubah.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1F2A24] mb-1.5">Lokasi barang</label>
                  <input 
                    type="text" 
                    name="lokasi"
                    placeholder="Kecamatan di Surabaya" 
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#2F7D5B] outline-none"
                    value={formData.lokasi}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Submit */}
          <button 
            type="submit" 
            className="w-full py-4 bg-[#2F7D5B] text-white font-bold text-lg rounded-xl hover:bg-[#25664a] active:scale-[0.99] transition-all shadow-lg shadow-[#2F7D5B]/20"
          >
            Terbitkan Barang Donasi
          </button>

        </form>
      </main>
    </div>
  );
};

export default HalamanUnggahDonasi;
