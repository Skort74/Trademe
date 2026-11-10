import React, { useState, useEffect } from "react";
import { registerUser } from "./utils/auth";

export default function HalamanBuatAkun({
  onNavigate,
  onRegisterSuccess,
  initialEmail = "",
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMsg("Silakan masukkan nama lengkap Anda.");
      return;
    }
    if (!cleanEmail) {
      setErrorMsg("Silakan masukkan email atau username Anda.");
      return;
    }
    // Allow either valid email or valid username
    if (cleanEmail.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setErrorMsg("Format email tidak valid.");
        return;
      }
    } else if (cleanEmail.length < 3) {
      setErrorMsg("Username minimal 3 karakter.");
      return;
    }

    if (!password) {
      setErrorMsg("Silakan tentukan kata sandi Anda.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = registerUser({
        fullName: cleanName,
        email: cleanEmail,
        password: password,
      });

      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }

      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman login...");

      // Tunggu sejenak lalu arahkan kembali ke Login dengan prefill email & pesan panduan
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(result.user);
        }
        if (onNavigate) {
          onNavigate("login", {
            initialEmail: cleanEmail,
            initialNotice: `Akun "${cleanEmail}" berhasil didaftarkan! Silakan masukkan kata sandi untuk masuk.`,
          });
        }
      }, 900);
    }, 600);
  };

  const handleGoogleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const googleUser = {
        fullName: "Pengguna Google",
        email: "google.user@gmail.com",
        username: "google_user",
        password: "password123",
      };
      registerUser(googleUser);
      setSuccessMsg("Pendaftaran dengan Google berhasil!");
      setTimeout(() => {
        if (onNavigate) {
          onNavigate("login", {
            initialEmail: googleUser.email,
            initialNotice: "Pendaftaran Google berhasil! Silakan masuk.",
          });
        }
      }, 700);
    }, 800);
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
            Bergabung dengan kami
          </p>

          {/* Heading */}
          <h1 className="text-[#1F2A24] text-[34px] sm:text-[38px] font-bold leading-tight sm:leading-[57px] tracking-[-0.0395em] mb-1">
            Buat akun TradeMe
          </h1>

          {/* Subtitle */}
          <p className="text-[#66736C] text-[13px] leading-[19.5px] mb-6">
            Mulai memberi manfaat baru pada barangmu hari ini.
          </p>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errorMsg}</span>
              </div>
              {errorMsg.includes("sudah terdaftar") && (
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate("login", { initialEmail: email })}
                  className="font-bold text-[#2F7D5B] underline hover:text-[#25664a] text-xs whitespace-nowrap"
                >
                  Masuk di sini
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
            {/* Nama Lengkap Field */}
            <div className="w-full flex flex-col mb-4">
              <label
                htmlFor="register-fullname-input"
                className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px] mb-1.5"
              >
                Nama lengkap
              </label>
              <div className="relative w-full">
                <input
                  id="register-fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Contoh: Budi Santoso"
                  autoComplete="name"
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-[13px] text-[#1F2A24] placeholder:text-[rgba(31,42,36,0.45)] placeholder:font-normal font-medium transition-all duration-150 outline-none hover:border-[#BFCFC3] focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="w-full flex flex-col mb-4">
              <label
                htmlFor="register-email-input"
                className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px] mb-1.5"
              >
                Email
              </label>
              <div className="relative w-full">
                <input
                  id="register-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#DCE6DF] bg-[#FBFDFB] text-[13px] text-[#1F2A24] placeholder:text-[rgba(31,42,36,0.45)] placeholder:font-normal font-medium transition-all duration-150 outline-none hover:border-[#BFCFC3] focus:border-[#2F7D5B] focus:bg-white focus:ring-2 focus:ring-[#2F7D5B]/20"
                />
              </div>
            </div>

            {/* Kata Sandi Field */}
            <div className="w-full flex flex-col mb-6">
              <label
                htmlFor="register-password-input"
                className="text-[#1F2A24] text-[11px] font-bold leading-[16.5px] mb-1.5"
              >
                Kata sandi
              </label>
              <div className="relative w-full">
                <input
                  id="register-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[46px] px-5 flex justify-center items-center gap-2 rounded-xl bg-[#2F7D5B] hover:bg-[#25664a] active:scale-[0.99] text-[#FFF] text-base font-bold leading-6 shadow-[0_8px_18px_rgba(47,125,91,0.20)] hover:shadow-[0_10px_22px_rgba(47,125,91,0.28)] transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Daftar Sekarang</span>
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
            onClick={handleGoogleRegister}
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
            <span className="text-[#66736C]">Sudah punya akun?</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("login", { initialEmail: email })}
              className="text-[#2F7D5B] font-extrabold hover:underline cursor-pointer focus:outline-none"
            >
              Masuk
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
    </div>
  );
}
