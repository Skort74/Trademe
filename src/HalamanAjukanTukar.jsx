import React, { useState } from 'react';
import './HalamanAjukanTukar.css';

const HalamanAjukanTukar = ({ product, onBack, onNavigate }) => {
  const [barangTukar, setBarangTukar] = useState('');
  const [pesan, setPesan] = useState('');
  const [lokasiKetemu, setLokasiKetemu] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const defaultProduct = {
    nama: 'Meja Makan Kayu Jati',
    tipe: 'Tukar',
    kondisi: 'Sangat baik',
    kategori: 'Furnitur',
    deskripsi: 'Meja makan kayu jati solid, usia 5 tahun. Masih sangat layak pakai.',
    lokasi: 'Rungkut, Surabaya',
    pemilik: 'Budi Santoso',
    // Gunakan link gambar asli sebagai fallback
    foto: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=400&q=80' 
  };

  // Gabungkan: gunakan data dari product jika ada, tapi timpa 'foto' jika kosong
  const barangTarget = {
    ...defaultProduct,       // Isi dulu dengan data default (termasuk foto)
    ...(product || {}),      // Timpa dengan data dari props (jika ada)
    // PENTING: Jika product.foto kosong, tetap pakai defaultProduct.foto
    foto: (product && product.foto) ? product.foto : defaultProduct.foto
  };

 // Data dummy barang milik user
  const barangSaya = [
    { 
      id: 1, 
      nama: 'Lemari Buku Minimalis', 
      kondisi: 'Baik', 
      // Ganti dengan link gambar asli
      foto: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=100&q=80' 
    },
    { 
      id: 2, 
      nama: 'Kursi Kayu Vintage', 
      kondisi: 'Sangat baik', 
      foto: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=100&q=80' 
    },
    { 
      id: 3, 
      nama: 'Rak Dinding Industrial', 
      kondisi: 'Baik', 
      foto: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=100&q=80' 
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simpan data dan tampilkan halaman sukses
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else if (onBack) {
      onBack();
    }
  };

  // Jika sudah submit, tampilkan halaman sukses
  if (isSubmitted) {
    return (
      <div className="ajukan-tukar-container">
        <div className="success-page">
          <div className="success-card">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="32" fill="#E8F5E9"/>
                <path d="M21 32L28 39L43 24" stroke="#2F7D5B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h1 className="success-title">Pengajuan tukar berhasil</h1>
            
            <p className="success-subtitle">
              Silakan lanjutkan proses dengan pemilik barang untuk serah terima.
            </p>

            <div className="transaction-info">
              <div className="info-row">
                <span className="info-label">Barang kamu:</span>
                <span className="info-value">{barangTukar || 'Lemari Buku Minimalis'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Barang target:</span>
                <span className="info-value">{barangTarget.nama}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Lokasi ketemu:</span>
                <span className="info-value">{lokasiKetemu || 'Ketintang'}</span>
              </div>
            </div>

            <div className="success-actions">
              <button 
                onClick={handleBackToHome}
                className="btn-primary"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form pengajuan tukar (sebelum submit)
  return (
    <div className="ajukan-tukar-container">
      <div className="ajukan-tukar-header">
        <button onClick={onBack} className="back-link">← Kembali ke beranda</button>
        <h1 className="page-title">Ajukan Tukar Barang</h1>
        <p className="page-subtitle">Pilih barang kamu yang ingin ditukarkan</p>
      </div>

      <form onSubmit={handleSubmit} className="ajukan-tukar-form">
        {/* Card Barang Target */}
        <div className="tukar-card">
          <div className="tukar-card-header">
            <span className="badge-tukar">Tukar</span>
            <h3>Barang yang ingin kamu tukar</h3>
          </div>
          
          <div className="barang-target">
            <img 
              src={barangTarget.foto} 
              alt={barangTarget.nama}
              className="barang-foto"
            />
            <div className="barang-info">
              <h4>{barangTarget.nama}</h4>
              <div className="barang-meta">
                <span className="badge-kondisi">{barangTarget.kondisi}</span>
                <span className="badge-kategori">{barangTarget.kategori}</span>
              </div>
              <p className="barang-deskripsi">{barangTarget.deskripsi}</p>
              <div className="barang-pemilik">
                <div className="pemilik-avatar">BS</div>
                <div className="pemilik-info">
                  <p className="pemilik-nama">{barangTarget.pemilik}</p>
                  <p className="pemilik-lokasi"> {barangTarget.lokasi}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Pilih Barang Tukar */}
        <div className="tukar-card">
          <h3>Pilih barang kamu untuk ditukar</h3>
          <p className="card-subtitle">Pilih satu barang dari daftar barangmu</p>
          
          <div className="barang-saya-list">
            {barangSaya.map((barang) => (
              <label key={barang.id} className="barang-saya-item">
                <input
                  type="radio"
                  name="barangTukar"
                  value={barang.nama}
                  checked={barangTukar === barang.nama}
                  onChange={(e) => setBarangTukar(e.target.value)}
                  required
                />
                <div className="barang-saya-content">
                  <img src={barang.foto} alt={barang.nama} className="barang-saya-foto" />
                  <div className="barang-saya-info">
                    <p className="barang-saya-nama">{barang.nama}</p>
                    <span className="badge-kondisi">{barang.kondisi}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Card Lokasi Pertemuan */}
        <div className="tukar-card">
          <h3>Lokasi pertemuan</h3>
          <p className="card-subtitle">Tentukan tempat untuk bertemu dan bertukar barang</p>
          
          <input
            type="text"
            placeholder="Contoh: Cafe Starbucks Rungkut, Surabaya"
            value={lokasiKetemu}
            onChange={(e) => setLokasiKetemu(e.target.value)}
            className="input-field"
            required
          />
          
          <div className="map-placeholder">
            <div className="map-icon"></div>
            <p>Peta akan ditampilkan di sini</p>
          </div>
        </div>

        {/* Card Pesan/Negosiasi */}
        <div className="tukar-card">
          <h3>Pesan untuk pemilik</h3>
          <p className="card-subtitle">Tulis pesan atau negosiasi tambahan (opsional)</p>
          
          <textarea
            placeholder="Contoh: Saya tertarik dengan meja ini. Apakah bisa ketemu hari Sabtu?"
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="textarea-field"
            rows="4"
          />
        </div>

        {/* Card Ringkasan */}
        <div className="tukar-card ringkasan-card">
          <h3>Ringkasan pengajuan tukar</h3>
          
          <div className="ringkasan-item">
            <span>Barang kamu:</span>
            <strong>{barangTukar || '-'}</strong>
          </div>
          <div className="ringkasan-item">
            <span>Barang target:</span>
            <strong>{barangTarget.nama}</strong>
          </div>
          <div className="ringkasan-item">
            <span>Lokasi ketemu:</span>
            <strong>{lokasiKetemu || '-'}</strong>
          </div>
          
          <div className="info-box">
            <p>Pemilik barang akan menerima pengajuan ini dan dapat menyetujui atau menolak. Kamu akan mendapat notifikasi setelah ada respon.</p>
          </div>
        </div>

        {/* Tombol Submit */}
        <button type="submit" className="btn-ajukan-tukar">
          Kirim Pengajuan Tukar
        </button>
      </form>
    </div>
  );
};

export default HalamanAjukanTukar;