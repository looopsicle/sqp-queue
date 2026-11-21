"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(
      "Autentikasi belum dihubungkan. Sambungkan form ini ke endpoint login admin sebelum digunakan.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4D8B45] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#E8EFD9] font-black text-[#4D8B45]">
          SQP
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-[.2em] text-[#4D8B45]">
          Scientia Square Park
        </p>
        <h1 className="mt-2 text-center text-2xl font-extrabold text-[#263B29]">
          Staff Portal
        </h1>
        <p className="mt-2 text-center text-sm text-[#788275]">
          Masuk untuk mengelola operasional taman.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-[#344532]">
            Email / ID Staff
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              autoComplete="username"
              placeholder="Masukkan email atau ID staff"
              className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-4 py-3 outline-none focus:border-[#4D8B45] focus:ring-2 focus:ring-[#4D8B45]/15"
            />
          </label>

          <label className="block text-sm font-semibold text-[#344532]">
            Password
            <input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan password"
              className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-4 py-3 outline-none focus:border-[#4D8B45] focus:ring-2 focus:ring-[#4D8B45]/15"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          <button className="w-full rounded-xl bg-[#4D8B45] px-4 py-3 font-bold text-white hover:bg-[#3F783B]">
            Masuk
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#9AA397]">
          Akses khusus staff Scientia Square Park
        </p>
      </div>
    </main>
  );
}
