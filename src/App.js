
import React, { useState } from "react";
import TradeMeHome from "./TradeMeHome";
import HalamanDetailLelang from "./HalamanDetailLelang";
import HalamanLogin from "./HalamanLogin";
import HalamanBuatAkun from "./HalamanBuatAkun";
import DetailCard from "./DetailCard";
import HalamanAjukanTukar from "./HalamanAjukanTukar";
import HalamanCheckout from "./HalamanCheckout";
import HalamanSuksesPembayaran from "./HalamanSuksesPembayaran";
import HalamanChat from "./HalamanChat";
import PanelAdminBarang from "./PanelAdminBarang";
import HalamanDonasi from "./HalamanDonasi";
import UnggahBarang from "./UnggahBarang";
import HalamanProfil from "./HalamanProfil";

import {
  getCurrentSession,
  clearCurrentSession,
  updateCurrentUser,
} from "./utils/auth";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return window.location.pathname === "/unggah"
      ? "unggah"
      : "login";
  });

  const [currentUser, setCurrentUser] = useState(
    () => getCurrentSession()
  );

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [navParams, setNavParams] = useState({});

  // NAVIGASI HALAMAN
  const handleNavigate = (page, params = {}) => {
    setNavParams(params);

    if (params.product) {
      setSelectedProduct(params.product);
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // LOGIN BERHASIL
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    handleNavigate("home");
  };

  // LOGOUT
  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);

    handleNavigate("login", {
      initialNotice:
        "Anda telah keluar. Silakan masukkan kredensial Anda untuk masuk kembali.",
    });
  };

  const handleUpdateProfile = (profile) => {
    const updatedUser = updateCurrentUser(profile);

    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  // PILIH PRODUK
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);

    if (product && product.category === "Lelang") {
      handleNavigate("lelang_detail", { product });
    } else {
      handleNavigate("detail", { product });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF]">

      {/* 1. HALAMAN LOGIN */}
      {currentPage === "login" && (
        <HalamanLogin
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
          initialEmail={navParams.initialEmail || ""}
          initialNotice={navParams.initialNotice || ""}
        />
      )}

      {/* 2. HALAMAN BUAT AKUN */}
      {currentPage === "register" && (
        <HalamanBuatAkun
          onNavigate={handleNavigate}
          initialEmail={navParams.initialEmail || ""}
        />
      )}

      {/* 3. HOMEPAGE */}
      {currentPage === "home" && (
        <TradeMeHome
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* 4. DETAIL BARANG */}
      {currentPage === "detail" && (
        <DetailCard
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {/* 5. DETAIL LELANG */}
      {currentPage === "lelang_detail" && (
        <HalamanDetailLelang
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 6. AJUKAN TUKAR */}
      {currentPage === "ajukan_tukar" && (
        <HalamanAjukanTukar
          product={selectedProduct || navParams.product}
          onBack={() =>
            handleNavigate("detail", {
              product: selectedProduct || navParams.product,
            })
          }
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 7. CHECKOUT */}
      {currentPage === "checkout" && (
        <HalamanCheckout
          product={selectedProduct || navParams.product}
          onBack={() =>
            handleNavigate("detail", {
              product: selectedProduct || navParams.product,
            })
          }
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 8. PEMBAYARAN BERHASIL */}
      {currentPage === "payment_success" && (
        <HalamanSuksesPembayaran
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 9. HALAMAN CHAT */}
      {currentPage === "chat" && (
        <HalamanChat
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 10. PANEL ADMIN */}
      {currentPage === "admin" && (
        <PanelAdminBarang
          onNavigate={handleNavigate}
        />
      )}

      {/* 11. HALAMAN DONASI */}
      {currentPage === "donasi" && (
        <HalamanDonasi
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 12. HALAMAN UNGGAH BARANG */}
      {currentPage === "unggah" && (
        <UnggahBarang
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 13. HALAMAN PROFIL */}
      {currentPage === "profile" && (
        <HalamanProfil
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}
