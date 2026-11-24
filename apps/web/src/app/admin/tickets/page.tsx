"use client";

import { useState } from "react";
import { ADMIN_ATTRACTIONS } from "../../../data/adminData";

type TicketRow = {
  code: string;
  name: string;
  attraction: string;
  quantity: number;
  date: string;
  status: string;
};

export default function ManualTicketEntryPage() {
  const [holder, setHolder] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [attraction, setAttraction] = useState(ADMIN_ATTRACTIONS[0].id);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [validDate, setValidDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<TicketRow[]>([
    {
      code: "SQP261102103019",
      name: "Guest Example",
      attraction: "SQP Express",
      quantity: 3,
      date: "02/11/2026",
      status: "Tercatat",
    },
  ]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const selected = ADMIN_ATTRACTIONS.find((a) => a.id === attraction);

    setRows((current) => [
      {
        code: orderNumber,
        name: holder,
        attraction: selected?.name || attraction,
        quantity: Number(quantity),
        date: validDate,
        status: "Input manual",
      },
      ...current,
    ]);
    setMessage(
      "Data tiket ditambahkan ke daftar sementara. Hubungkan form ke API agar tersimpan permanen.",
    );
    setHolder("");
    setOrderNumber("");
    setOrderRef("");
    setQuantity("1");
    setUnitPrice("");
    setValidDate("");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Buat / Input Tiket</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Masukkan data tiket secara manual. Fitur pemindaian struk tidak
          digunakan pada portal ini.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-[#E4EAE0] bg-white p-5"
        >
          <div>
            <h3 className="text-lg font-extrabold">Data tiket pengunjung</h3>
            <p className="text-sm text-[#778274]">
              Kolom bertanda * wajib diisi.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Nama pengunjung *
              <input
                required
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="Nama sesuai tiket"
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Nomor tiket / Order Number *
              <input
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Contoh: SQP261102103019"
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Order Ref
              <input
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="Opsional"
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Aktivitas *
              <select
                value={attraction}
                onChange={(e) =>
                  setAttraction(e.target.value as typeof attraction)
                }
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              >
                {ADMIN_ATTRACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              Jumlah tiket / pengunjung *
              <input
                required
                min="1"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Harga satuan
              <input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Contoh: 40000"
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Tanggal berlaku *
              <input
                required
                type="date"
                value={validDate}
                onChange={(e) => setValidDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Catatan
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Catatan tambahan (opsional)"
                className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-3 py-3 font-normal"
              />
            </label>
          </div>

          {message && (
            <p
              role="status"
              className="rounded-xl bg-[#E8EFD9] p-3 text-sm text-[#3F783B]"
            >
              {message}
            </p>
          )}

          <button className="w-full rounded-xl bg-[#4D8B45] px-5 py-3 font-bold text-white hover:bg-[#3F783B]">
            Simpan data tiket
          </button>
        </form>

        <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5">
          <h3 className="text-lg font-extrabold">Panduan input manual</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#697565]">
            <p className="rounded-xl bg-[#F5F7F2] p-4">
              <strong className="block text-[#263B29]">
                1. Identitas tiket
              </strong>
              Masukkan nama pengunjung dan nomor tiket / Order Number dari
              sumber transaksi.
            </p>
            <p className="rounded-xl bg-[#F5F7F2] p-4">
              <strong className="block text-[#263B29]">
                2. Aktivitas dan jumlah
              </strong>
              Pilih aktivitas yang sesuai, lalu isi jumlah pengunjung dan harga
              tiket.
            </p>
            <p className="rounded-xl bg-[#F5F7F2] p-4">
              <strong className="block text-[#263B29]">
                3. Tanggal berlaku
              </strong>
              Pastikan tanggal berlaku sesuai dengan tiket yang diterbitkan.
            </p>
            <p className="rounded-xl border border-[#F2D58A] bg-[#FFF9E8] p-4 text-[#80651E]">
              Data saat ini hanya disimpan sementara di halaman browser.
              Backend dan validasi nomor tiket perlu dihubungkan sebelum
              dipakai operasional.
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5">
        <h3 className="text-lg font-extrabold">Tiket yang baru dicatat</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#F5F7F2] text-xs uppercase text-[#778274]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Pengunjung</th>
                <th className="p-3">Aktivitas</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.code}-${i}`}
                  className="border-b border-[#EDF0EA]"
                >
                  <td className="p-3 font-semibold">{r.code}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.attraction}</td>
                  <td className="p-3">{r.quantity}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-[#E8EFD9] px-2 py-1 text-xs font-bold text-[#3F783B]">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
