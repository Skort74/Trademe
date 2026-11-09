import React, { useState } from "react";
import TradeMeHome from "./TradeMeHome";
import HalamanLogin from "./HalamanLogin";
import HalamanBuatAkun from "./HalamanBuatAkun";
import DetailCard from "./DetailCard";
import HalamanCheckout from "./HalamanCheckout";
import HalamanSuksesPembayaran from "./HalamanSuksesPembayaran";
import HalamanChat from "./HalamanChat";
import PanelAdminBarang from "./PanelAdminBarang";
import { getCurrentSession, clearCurrentSession } from "./utils/auth";

export default function App() {
  // Pertama kali akses HARUS ke halaman login
  const [currentPage, setCurrentPage] = useState("login"); // "login" | "register" | "home" | "detail" | "checkout" | "payment_success" | "chat" | "admin"
  const [currentUser, setCurrentUser] = useState(() => getCurrentSession());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [navParams, setNavParams] = useState({});

  const handleNavigate = (page, params = {}) => {
    setNavParams(params);
    if (params.product) {
      setSelectedProduct(params.product);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    // Jika username dan password cocok -> masuk ke homepage
    handleNavigate("home");
  };

  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
    handleNavigate("login", {
      initialNotice: "Anda telah keluar. Silakan masukkan kredensial Anda untuk masuk kembali.",
    });
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    handleNavigate("detail", { product });
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF]">
      {/* 1. HALAMAN LOGIN (Akses pertama kali) */}
      {currentPage === "login" && (
        <HalamanLogin
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
          initialEmail={navParams.initialEmail || ""}
          initialNotice={navParams.initialNotice || ""}
        />
      )}

      {/* 2. HALAMAN BUAT AKUN (Jika akun belum terdaftar dan menerima penawaran) */}
      {currentPage === "register" && (
        <HalamanBuatAkun
          onNavigate={handleNavigate}
          initialEmail={navParams.initialEmail || ""}
        />
      )}

      {/* 3. HOMEPAGE (Jika username dan kata sandi cocok) */}
      {currentPage === "home" && (
        <TradeMeHome
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* 4. DETAIL CARD / HALAMAN DETAIL BARANG */}
      {currentPage === "detail" && (
        <DetailCard
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 5. HALAMAN CHECKOUT / PEMBAYARAN & SERAH TERIMA */}
      {currentPage === "checkout" && (
        <HalamanCheckout
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("detail", { product: selectedProduct || navParams.product })}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 6. HALAMAN PEMBAYARAN BERHASIL (SUCCESS STATE) */}
      {currentPage === "payment_success" && (
        <HalamanSuksesPembayaran
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 7. HALAMAN CHAT / PESAN */}
      {currentPage === "chat" && (
        <HalamanChat
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 8. PANEL ADMIN (Bila diperlukan) */}
      {currentPage === "admin" && (
        <PanelAdminBarang onNavigate={handleNavigate} />
      )}
    </div>
  );
}
