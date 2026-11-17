import React, { useEffect, useState } from "react";
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


// Halaman terakhir disimpan per tab agar refresh tidak kembali ke login
const NAV_STATE_KEY = "treadme_nav_state";
const KNOWN_PAGES = [
  "home", "detail", "lelang_detail", "ajukan_tukar", "checkout", "payment_success",
  "chat", "admin", "donasi", "unggah", "profile",
];

function readNavState() {
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/** Tentukan halaman awal saat aplikasi dimuat / di-refresh */
function getInitialNav() {
  const user = getCurrentSession();
  if (window.location.pathname === "/unggah") {
    return { page: "unggah", params: {}, history: [] };
  }
  // Belum login → halaman login
  if (!user) return { page: "login", params: {}, history: [] };

  // Sudah login → lanjutkan halaman terakhir di tab ini
  const saved = readNavState();
  const allowed = (p) => KNOWN_PAGES.includes(p) && (p !== "admin" || user.role === "admin");
  if (saved && allowed(saved.page)) {
    return {
      page: saved.page,
      params: saved.params || {},
      history: Array.isArray(saved.history) ? saved.history.filter((h) => allowed(h.page)) : [],
    };
  }
  return { page: user.role === "admin" ? "admin" : "home", params: {}, history: [] };
}

export default function App() {
  const [initialNav] = useState(getInitialNav);
  const [currentPage, setCurrentPage] = useState(initialNav.page);

  const [currentUser, setCurrentUser] = useState(() => getCurrentSession());
  const [selectedProduct, setSelectedProduct] = useState(initialNav.params.product || null);
  const [navParams, setNavParams] = useState(initialNav.params);
  // Riwayat halaman untuk tombol "Kembali" ({ page, params })
  const [history, setHistory] = useState(initialNav.history);

  // Simpan posisi halaman selama sudah login (dipulihkan saat refresh)
  useEffect(() => {
    try {
      if (!currentUser || ["login", "register"].includes(currentPage)) {
        sessionStorage.removeItem(NAV_STATE_KEY);
        return;
      }
      sessionStorage.setItem(
        NAV_STATE_KEY,
        JSON.stringify({ page: currentPage, params: navParams, history })
      );
    } catch (e) {
      // sessionStorage penuh / tidak tersedia → abaikan, cukup tidak dipulihkan
    }
  }, [currentUser, currentPage, navParams, history]);

  const showPage = (page, params) => {
    setNavParams(params);
    if (params.product) {
      setSelectedProduct(params.product);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // NAVIGASI HALAMAN
  // options.replace = true → halaman saat ini tidak dicatat di riwayat
  // (mis. checkout → pembayaran berhasil, agar "Kembali" tidak membuka checkout lagi)
  const handleNavigate = (page, params = {}, options = {}) => {
    const AUTH_PAGES = ["login", "register"];
    if (page === "home") {
      setHistory([]); // beranda adalah titik awal
    } else if (!options.replace && currentPage !== page) {
      const keep = !AUTH_PAGES.includes(currentPage) || AUTH_PAGES.includes(page);
      if (keep) setHistory((h) => [...h, { page: currentPage, params: navParams }].slice(-30));
    } else if (!options.replace && currentPage === page) {
      setHistory((h) => [...h, { page: currentPage, params: navParams }].slice(-30));
    }
    showPage(page, params);
  };

  // KEMBALI KE HALAMAN SEBELUMNYA
  const handleGoBack = () => {
    const prev = history[history.length - 1];
    if (!prev) return showPage("home", {});
    setHistory((h) => h.slice(0, -1));
    showPage(prev.page, prev.params || {});
  };
  const onGoBack = history.length > 0 ? handleGoBack : undefined;

  // LOGIN BERHASIL
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setHistory([]);
    showPage(user && user.role === "admin" ? "admin" : "home", {});
  };

  // LOGOUT
  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
    setHistory([]);
    showPage("login", {
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
          onGoBack={onGoBack}
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
          initialEmail={navParams.initialEmail || ""}
          initialNotice={navParams.initialNotice || ""}
        />
      )}

      {/* 2. HALAMAN BUAT AKUN */}
      {currentPage === "register" && (
        <HalamanBuatAkun
          onGoBack={onGoBack}
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
          onGoBack={onGoBack}
          product={selectedProduct || navParams.product}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      
      {/* 4b. HALAMAN DETAIL LELANG */}

      {/* 5. DETAIL LELANG */}
      {currentPage === "lelang_detail" && (
        <HalamanDetailLelang
          onGoBack={onGoBack}
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
          onGoBack={onGoBack}
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
          onGoBack={onGoBack}
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
          onGoBack={onGoBack}
          paymentInfo={navParams.paymentInfo}
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
          onGoBack={onGoBack}
          product={navParams.product}
          openOffer={!!navParams.openOffer}
          initialConversationId={navParams.conversationId}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 10. PANEL ADMIN */}
      {currentPage === "admin" && (
        <PanelAdminBarang
          onGoBack={onGoBack}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 11. HALAMAN DONASI */}
      {currentPage === "donasi" && (
        <HalamanDonasi
          onGoBack={onGoBack}
          onBack={() => handleNavigate("home")}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 12. HALAMAN UNGGAH BARANG */}
      {currentPage === "unggah" && (
        <UnggahBarang
          onGoBack={onGoBack}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 13. HALAMAN PROFIL */}
      {currentPage === "profile" && (
        <HalamanProfil
          onGoBack={onGoBack}
          openAddressEditor={!!navParams.editAddress}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}