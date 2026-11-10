import React, { useState, useEffect } from "react";
import { findUserByLoginIdentifier, setCurrentSession } from "./utils/auth";

export default function HalamanLogin({
  onNavigate,
  onLoginSuccess,
  initialEmail = "",
  initialNotice = "",
}) {
  const [identifier, setIdentifier] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(initialNotice);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [unregisteredIdentifier, setUnregisteredIdentifier] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Update identifier if initialEmail changes (e.g. coming from registration)
  useEffect(() => {
    if (initialEmail) {
      setIdentifier(initialEmail);
    }
    if (initialNotice) {
      setSuccessMsg(initialNotice);
    }
  }, [initialEmail, initialNotice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMsg("Silakan masukkan email atau username Anda.");
      return;
    }
    if (!password) {
      setErrorMsg("Silakan masukkan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    // Simulate authenticating against registered users
    setTimeout(() => {
      setIsLoading(false);
      const user = findUserByLoginIdentifier(cleanIdentifier);

      // KONDISI 1: User belum terdaftar -> berikan penawaran untuk buat akun!
      if (!user) {
        setUnregisteredIdentifier(cleanIdentifier);
        setShowOfferModal(true);
        setErrorMsg(
          `Akun "${cleanIdentifier}" belum terdaftar di sistem. Silakan buat akun terlebih dahulu.`
        );
        return;
      }

      // KONDISI 2: User terdaftar tetapi password salah
      if (user.password !== password) {
        setErrorMsg("Kata sandi salah. Silakan periksa kembali kata sandi Anda.");
        return;
      }

      // KONDISI 3: Username dan password cocok -> Masuk ke Homepage!
      setCurrentSession(user);
      setSuccessMsg(`Berhasil masuk! Selamat datang, ${user.fullName || user.username}.`);

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else if (onNavigate) {
          onNavigate("home");
        }
      }, 700);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const googleUser = {
        fullName: "Pengguna Google",
        email: "google.user@gmail.com",
        username: "google_user",
      };
      setCurrentSession(googleUser);
      setSuccessMsg("Berhasil masuk dengan Google!");
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(googleUser);
        } else if (onNavigate) {
          onNavigate("home");
        }
      }, 700);
    }, 800);
  };

  const handleAcceptOffer = () => {
    setShowOfferModal(false);
    if (onNavigate) {
      // Beralih ke halaman registrasi dengan membawa identifier yang telah diketik
      onNavigate("register", { initialEmail: unregisteredIdentifier });
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setForgotSuccess(false);
      setForgotEmail("");
      setSuccessMsg("Tautan reset kata sandi telah dikirim ke email Anda.");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] flex flex-col lg:flex-row overflow-x-hidden font-plusJakartaSans">
      {/* ================= LEFT COLUMN: FORM ================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-14 xl:px-24 py-8 lg:py-10 min-h-screen">
        {/* Brand Header */}
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="TradeMe Home"
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
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[430px] mx-auto my-auto py-6">
          {/* Eyebrow */}
          <p className="text-[#2F7D5B] text-[11px] font-extrabold leading-[16.5px] tracking-[0.1636em] uppercase mb-2">
            Selamat datang kembali
          </p>

          {/* Heading */}
          <h1 className="text-[#1F2A24] text-[34px] sm:text-[38px] font-bold leading-tight sm:leading-[57px] tracking-[-0.0395em] mb-1">
            Masuk ke akunmu
          </h1>

          {/* Subtitle */}
          <p className="text-[#66736C] text-[13px] leading-[19.5px] mb-6">
            Lanjutkan berbagi, berhemat, dan memberi dampak.
          </p>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errorMsg}</span>
              </div>
              {errorMsg.includes("belum terdaftar") && (
                <button
                  type="button"
                  onClick={handleAcceptOffer}
                  className="font-bold text-[#2F7D5B] underline hover:text-[#25664a] text-xs whitespace-nowrap self-end sm:self-auto"
                >
                  Buat akun sekarang &rarr;
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn shadow-sm">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            {/* Email / Username Field */}
            <div className="w-full flex flex-col mb-4">
              <label
                htmlFor="login-identifier-input"
                className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px] mb-1.5"
              >
                Email
              </label>
              <div className="relative w-full">
                <input
                  id="login-identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="nama@email.com"
                  autoComplete="username"
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-[13px] text-[#1F2A24] placeholder:text-[rgba(31,42,36,0.45)] placeholder:font-normal font-medium transition-all duration-150 outline-none hover:border-[#BFCFC3] focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
                />
              </div>
            </div>

            {/* Kata Sandi Field */}
            <div className="w-full flex flex-col mb-1">
              <label
                htmlFor="login-password-input"
                className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px] mb-1.5"
              >
                Kata sandi
              </label>
              <div className="relative w-full">
                <input
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Minimal 8 karakter"
                  autoComplete="current-password"
                  className="w-full h-[46px] pl-3.5 pr-11 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-[13px] text-[#1F2A24] placeholder:text-[rgba(31,42,36,0.45)] placeholder:font-normal font-medium transition-all duration-150 outline-none hover:border-[#BFCFC3] focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8780] hover:text-[#1F2A24] transition-colors p-1"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Ingat saya & Lupa kata sandi */}
            <div className="flex items-center justify-between mt-3 mb-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#DCE6DF] text-[#2F7D5B] accent-[#2F7D5B] focus:ring-[#2F7D5B] cursor-pointer"
                />
                <span className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px]">
                  Ingat saya
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[#2F7D5B] text-[10px] font-bold leading-[15px] hover:underline transition-colors focus:outline-none"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[46px] px-5 flex justify-center items-center gap-2 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-[#FFF] text-base font-bold leading-6 shadow-[0_8px_18px_rgba(47,125,91,0.20)] hover:shadow-[0_10px_22px_rgba(47,125,91,0.28)] transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-[#DCE6DF]"></div>
            <span className="absolute bg-[#FFF] px-3 text-[#8A948E] text-[9.5px] leading-[13.5px] tracking-wide select-none">
              atau lanjut dengan
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-[46px] px-5 flex justify-center items-center gap-2.5 rounded-xl border border-[#DCE6DF] bg-[#FFF] hover:bg-[#F9FBFA] active:bg-[#F0F5F2] hover:border-[#BFCFC3] transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            {/* Official 4-color Google G icon */}
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-[#1F2A24] text-base font-bold leading-6">
              Google
            </span>
          </button>

          {/* Footer Navigation */}
          <div className="w-full flex items-center justify-center gap-1.5 mt-8 text-[11px] leading-[16.5px]">
            <span className="text-[#66736C]">Belum punya akun?</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("register")}
              className="text-[#2F7D5B] font-extrabold hover:underline cursor-pointer focus:outline-none"
            >
              Daftar gratis
            </button>
          </div>
        </div>

        {/* Footer legal note or spacer */}
        <div className="w-full text-center lg:text-left text-[11px] text-[#A0AAA3]">
          <span>© {new Date().getFullYear()} TradeMe Inc. Berbagi untuk kebaikan.</span>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: HERO BANNER ================= */}
      <div className="w-full lg:w-1/2 p-3 sm:p-5 lg:p-4.5 xl:p-6 flex items-center justify-center">
        <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[calc(100vh-36px)] max-h-[840px] rounded-[25px] overflow-hidden shadow-[0_20px_45px_-12px_rgba(20,52,36,0.25)] group">
          {/* Main Background Image */}
          <img
            src="/ImageKomunitasSalingBerbagiBarangLayakPakai.png"
            alt="Komunitas saling berbagi barang layak pakai"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Dark Green Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#143424]/90 via-[#143424]/35 to-transparent pointer-events-none" />

          {/* Subtle Top Vignette */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

          {/* Quote & SDG Tagline */}
          <div className="absolute bottom-8 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col items-start z-10">
            <h2 className="text-[#FFF] text-xl sm:text-2xl lg:text-[24px] xl:text-[26px] font-bold leading-snug sm:leading-[35px] max-w-[580px] drop-shadow-md mb-3">
              “Barang yang tidak lagi kita pakai, bisa jadi sangat berarti bagi orang lain.”
            </h2>

            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-[#52D288] animate-pulse"></span>
              <p className="text-[#D8EADF] text-[11px] sm:text-xs font-medium tracking-wide">
                Gerakan TradeMe untuk SDG 1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL PENAWARAN BUAT AKUN (OFFER MODAL) ================= */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-[#DCE6DF] text-center">
            {/* Friendly Avatar / Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#EAF5EF] text-[#2F7D5B] mx-auto mb-4 flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-[#1F2A24] mb-2 tracking-tight">
              Akun Belum Terdaftar
            </h3>
            
            <p className="text-xs sm:text-[13px] text-[#66736C] leading-relaxed mb-6">
              Email atau username <span className="font-bold text-[#1F2A24]">"{unregisteredIdentifier}"</span> belum terdaftar di TradeMe. 
              Yuk, buat akun sekarang agar kamu bisa langsung mulai berbagi dan bertransaksi!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-[#DCE6DF] text-xs font-bold text-[#66736C] hover:bg-gray-50 transition-colors"
              >
                Coba Lagi
              </button>

              <button
                type="button"
                onClick={handleAcceptOffer}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] text-xs font-bold text-white shadow-md shadow-[#2F7D5B]/25 hover:shadow-lg transition-all"
              >
                Buat Akun Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-[#DCE6DF]">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Tutup"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-[#1F2A24] mb-2">Reset Kata Sandi</h3>
            <p className="text-xs text-[#66736C] mb-5">
              Masukkan email yang terdaftar untuk menerima petunjuk pemulihan kata sandi.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Email pemulihan berhasil dikirim! Silakan periksa kotak masuk Anda.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#1F2A24] block mb-1.5">
                    Email Terdaftar
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full h-[44px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-xs text-[#1F2A24] focus:outline-none focus:border-[#2F7D5B] focus:ring-2 focus:ring-[#2F7D5B]/20"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#2F7D5B] hover:bg-[#25664a] rounded-lg transition-colors shadow-sm"
                  >
                    Kirim Instruksi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
