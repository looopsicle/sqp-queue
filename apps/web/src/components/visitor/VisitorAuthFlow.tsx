"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

type AuthView = "welcome" | "phone" | "register" | "otp" | "success";

interface VisitorAuthFlowProps {
  onGoogleSignIn: () => void;
  onContinueAsGuest: () => void;
  onPhoneSignIn: () => void;
}

const HERO_IMAGE = "/assets/visitor/visitor-auth-hero.png";

function ParkFooterDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden">
      <svg
        aria-hidden="true"
        viewBox="0 0 402 80"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0 31 C18 7 32 18 43 30 C54 2 79 4 91 26 C108 3 132 9 143 31 C160 5 183 11 194 31 C211 5 234 8 246 30 C263 6 287 11 298 31 C315 4 338 8 350 30 C367 6 389 11 402 29 L402 80 L0 80 Z"
          fill="#72D7B2"
        />
        <path
          d="M0 43 C22 22 38 30 52 43 C68 20 87 25 101 43 C120 21 139 28 153 44 C174 21 193 27 207 43 C225 21 246 28 260 44 C278 22 298 28 313 43 C334 20 354 27 369 43 C383 29 394 33 402 40 L402 80 L0 80 Z"
          fill="#00A878"
        />
        {Array.from({ length: 22 }, (_, index) => (
          <circle
            key={index}
            cx={(index * 47 + 13) % 402}
            cy={48 + ((index * 13) % 25)}
            r={index % 3 === 0 ? 3 : 2}
            fill={index % 2 === 0 ? "#075D43" : "#F4C52E"}
          />
        ))}
      </svg>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center justify-center gap-2 text-[#756A58]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E9F3D8] text-lg">
        🌿
      </span>
      <span className="text-xl font-semibold tracking-tight">SQP Park</span>
    </div>
  );
}

function AuthButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`min-h-12 w-full rounded-xl px-5 py-3 text-sm font-bold shadow-[0_3px_5px_rgba(0,0,0,0.16)] transition active:translate-y-px ${
        variant === "primary"
          ? "bg-[#F5BF2D] text-white hover:bg-[#E9B21F]"
          : "border border-[#E2E7DD] bg-white text-[#425B42] hover:bg-[#F7FAF4]"
      }`}
    >
      {children}
    </button>
  );
}

export default function VisitorAuthFlow({
  onGoogleSignIn,
  onContinueAsGuest,
  onPhoneSignIn,
}: VisitorAuthFlowProps) {
  const [view, setView] = useState<AuthView>("welcome");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpPurpose, setOtpPurpose] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState("");

  function sendLoginOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpPurpose("login");
    setOtpDigits(["", "", "", "", "", ""]);
    setNotice("Kode OTP siap dikirim melalui layanan autentikasi.");
    setView("otp");
  }

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpPurpose("register");
    setOtpDigits(["", "", "", "", "", ""]);
    setNotice("Verifikasi nomor telepon untuk menyelesaikan pendaftaran.");
    setView("otp");
  }

  function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otpDigits.join("").length !== 6) {
      setNotice("Masukkan 6 digit kode OTP.");
      return;
    }

    setNotice("");

    if (otpPurpose === "register") {
      setView("success");
    } else {
      // Connect this point to the visitor OTP verification API.
      onPhoneSignIn();
    }
  }

  const showHero = view === "welcome" || view === "phone" || view === "otp";

  return (
    <div className="relative flex min-h-screen w-full justify-center overflow-hidden bg-white pb-20">
      <section className="relative flex min-h-screen w-full max-w-[480px] flex-col bg-white">
        {showHero && (
          <div className="relative h-[190px] shrink-0 overflow-hidden">
            <img
              src={HERO_IMAGE}
              alt="Aktivitas di Scientia Square Park"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/0" />
          </div>
        )}

        <div
          className={`relative z-10 flex flex-1 flex-col items-center bg-white px-8 text-center ${
            showHero ? "-mt-5 rounded-t-[28px] pt-5" : "pt-12"
          }`}
        >
          <BrandMark />

          {view === "welcome" && (
            <div className="mt-7 w-full">
              <h1 className="text-2xl font-extrabold text-[#4D8B45]">
                Selamat Datang!
              </h1>
              <p className="mx-auto mt-2 max-w-[270px] text-xs leading-relaxed text-[#53634F]">
                Masuk ke akunmu untuk mengakses antrean dan tiket.
              </p>

              <div className="mt-7 space-y-3">
                <AuthButton variant="secondary" onClick={onGoogleSignIn}>
                  <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-white text-base">
                    G
                  </span>
                  Masuk Dengan Google
                </AuthButton>
                <AuthButton
                  variant="secondary"
                  onClick={() => setView("phone")}
                >
                  ☎ &nbsp; Masuk dengan Nomor Telepon (OTP)
                </AuthButton>
                <AuthButton onClick={onContinueAsGuest}>
                  Masuk sebagai Tamu
                </AuthButton>
              </div>

              <p className="mt-5 text-xs text-[#788275]">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setView("register")}
                  className="font-bold text-[#4D8B45] underline"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>
          )}

          {view === "phone" && (
            <div className="mt-8 w-full text-left">
              <h1 className="text-center text-xl font-extrabold text-[#4D8B45]">
                Login dengan Nomor Telepon
              </h1>
              <p className="mt-2 text-center text-xs text-[#53634F]">
                Masukkan nomor telepon kamu yang terdaftar.
              </p>
              <form onSubmit={sendLoginOtp} className="mt-8 space-y-5">
                <label className="block text-xs font-semibold text-[#53634F]">
                  Nomor Telepon
                  <div className="mt-2 flex overflow-hidden rounded-xl border border-[#D9DED5] shadow-sm">
                    <span className="border-r border-[#E2E7DD] bg-[#F8FAF6] px-3 py-3 text-sm text-[#53634F]">
                      +62
                    </span>
                    <input
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="min-w-0 flex-1 px-3 py-3 text-sm text-[#263B29] outline-none"
                      placeholder="812-3456-7890"
                    />
                  </div>
                </label>
                <AuthButton type="submit">Kirim Kode OTP</AuthButton>
              </form>
              <button
                type="button"
                onClick={() => setView("welcome")}
                className="mt-5 w-full text-center text-xs font-semibold text-[#4D8B45]"
              >
                ← Kembali
              </button>
            </div>
          )}

          {view === "register" && (
            <div className="mt-7 w-full text-left">
              <h1 className="text-center text-xl font-extrabold text-[#4D8B45]">
                Register
              </h1>
              <p className="mt-1 text-center text-xs text-[#53634F]">
                Buat akun baru di SQP Park.
              </p>
              <form onSubmit={submitRegistration} className="mt-6 space-y-3">
                <label className="block text-xs font-semibold text-[#53634F]">
                  Username
                  <input
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                    className="mt-1.5 w-full rounded-xl border border-[#D9DED5] px-4 py-3 text-sm outline-none focus:border-[#4D8B45]"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#53634F]">
                  Nomor Telepon
                  <div className="mt-1.5 flex overflow-hidden rounded-xl border border-[#D9DED5]">
                    <span className="border-r border-[#E2E7DD] bg-[#F8FAF6] px-3 py-3 text-sm">
                      +62
                    </span>
                    <input
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="812-3456-7890"
                      className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                    />
                  </div>
                </label>
                <label className="block text-xs font-semibold text-[#53634F]">
                  Password
                  <input
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Minimal 8 karakter"
                    className="mt-1.5 w-full rounded-xl border border-[#D9DED5] px-4 py-3 text-sm outline-none focus:border-[#4D8B45]"
                  />
                </label>
                <p className="text-[10px] leading-relaxed text-[#788275]">
                  • Minimal 8 karakter
                  <br />• Mengandung huruf dan angka
                </p>
                <AuthButton type="submit">Daftar</AuthButton>
              </form>
              <button
                type="button"
                onClick={() => setView("welcome")}
                className="mt-4 w-full text-center text-xs font-semibold text-[#4D8B45]"
              >
                Sudah punya akun? Login
              </button>
            </div>
          )}

          {view === "otp" && (
            <div className="mt-9 w-full">
              <h1 className="text-xl font-extrabold text-[#4D8B45]">
                Verifikasi OTP
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-[#53634F]">
                Masukkan 6 digit kode OTP yang telah dikirim ke{" "}
                <strong>+62 {phone}</strong>.
              </p>
              <form onSubmit={verifyOtp} className="mt-7">
                <div className="text-left text-xs font-semibold text-[#53634F]">
                  <span>Kode OTP</span>
                  <div className="mt-2 flex justify-center gap-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        required
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(event) => {
                          const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
                          setOtpDigits((current) =>
                            current.map((value, digitIndex) =>
                              digitIndex === index ? nextDigit : value
                            )
                          );
                        }}
                        className="h-12 w-11 rounded-xl border border-[#D9DED5] text-center text-xl font-bold text-[#263B29] outline-none focus:border-[#4D8B45] focus:ring-2 focus:ring-[#4D8B45]/15"
                        aria-label={`Digit OTP ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#788275]">
                  Kirim ulang kode jika belum diterima.
                </p>
                {notice && (
                  <p className="mt-2 text-xs text-[#4D8B45]">{notice}</p>
                )}
                <div className="mt-7">
                  <AuthButton type="submit">Verifikasi</AuthButton>
                </div>
              </form>
              <button
                type="button"
                onClick={() =>
                  setView(otpPurpose === "register" ? "register" : "phone")
                }
                className="mt-5 w-full text-center text-xs font-semibold text-[#4D8B45]"
              >
                ← Kembali
              </button>
            </div>
          )}

          {view === "success" && (
            <div className="mt-14 w-full">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#E6F5E6] text-5xl text-[#4CAF50]">
                ✓
              </div>
              <h1 className="mt-7 text-xl font-extrabold text-[#4D8B45]">
                Registrasi Berhasil!
              </h1>
              <p className="mx-auto mt-2 max-w-[260px] text-xs leading-relaxed text-[#53634F]">
                Akun kamu sudah dibuat. Yuk, login dan mulai gunakan layanan
                antrean serta tiket SQP Park.
              </p>
              <div className="mt-8">
                <AuthButton
                  onClick={() => {
                    setPassword("");
                    setView("welcome");
                  }}
                >
                  Login Sekarang
                </AuthButton>
              </div>
            </div>
          )}
        </div>

        <ParkFooterDecoration />
      </section>
    </div>
  );
}
