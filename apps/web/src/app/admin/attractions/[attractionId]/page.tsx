"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAdminAttraction } from "../../../../data/adminData";

type Tab = "monitoring" | "inspection" | "issues" | "history" | "edit";

export default function AttractionOperationsPage() {
  const params = useParams<{ attractionId: string }>();
  const attraction = useMemo(() => getAdminAttraction(params.attractionId), [params.attractionId]);
  const [tab, setTab] = useState<Tab>("monitoring");
  const [status, setStatus] = useState<"Buka" | "Jeda" | "Tutup">(attraction?.status || "Buka");
  const [capacity, setCapacity] = useState(String(attraction?.capacity || 10));
  const [visitorCode, setVisitorCode] = useState("");
  const [checkResult, setCheckResult] = useState("");
  const [issue, setIssue] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [saved, setSaved] = useState("");

  if (!attraction) return <div className="rounded-2xl bg-white p-8"><h2 className="text-xl font-bold">Aktivitas tidak ditemukan</h2><Link href="/admin/attractions" className="mt-4 inline-block text-[#4D8B45]">Kembali ke aktivitas</Link></div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "monitoring", label: "Monitoring antrean" },
    { id: "inspection", label: "Pemeriksaan pengunjung" },
    { id: "issues", label: "Catat kendala" },
    { id: "history", label: "Riwayat & laporan" },
    { id: "edit", label: "Cari & edit tiket" },
  ];

  function save(message: string) { setSaved(message); setTimeout(() => setSaved(""), 3000); }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/admin/attractions" className="text-sm font-bold text-[#4D8B45]">← Semua aktivitas</Link><h2 className="mt-3 text-2xl font-extrabold">{attraction.name}</h2><p className="mt-1 text-sm text-[#778274]">{attraction.location} · {attraction.category}</p></div><span className="rounded-full bg-[#E8EFD9] px-4 py-2 text-sm font-bold text-[#3F783B]">Staff activity portal</span></div>
    <div className="flex gap-2 overflow-x-auto border-b border-[#E1E8DD] pb-2">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold ${tab === t.id ? "bg-[#4D8B45] text-white" : "bg-white text-[#667362] hover:bg-[#E8EFD9]"}`}>{t.label}</button>)}</div>
    {saved && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{saved}</p>}
    {tab === "monitoring" && <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="text-lg font-extrabold">Status antrean</h3><p className="text-sm text-[#778274]">Kontrol operasional {attraction.name}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "Buka" ? "bg-green-50 text-green-700" : status === "Jeda" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{status}</span></div>
        <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F5F7F2] p-4"><p className="text-xs text-[#778274]">Pengunjung dalam antrean</p><p className="mt-1 text-3xl font-extrabold">08</p></div><div className="rounded-xl bg-[#F5F7F2] p-4"><p className="text-xs text-[#778274]">Kapasitas per sesi</p><p className="mt-1 text-3xl font-extrabold">{capacity}</p></div></div>
        <div className="mt-6"><label className="text-sm font-bold">Kapasitas antrean<input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} className="mt-2 block w-full rounded-xl border border-[#DCE4D8] px-4 py-3"/></label></div>
        <div className="mt-4 flex flex-wrap gap-2">{(["Buka","Jeda","Tutup"] as const).map(s => <button key={s} onClick={() => {setStatus(s);save(`Status antrean diubah menjadi ${s}. (Tampilan demo)`);}} className={`rounded-xl px-4 py-3 text-sm font-bold ${status === s ? "bg-[#4D8B45] text-white" : "bg-[#E8EFD9] text-[#3F783B]"}`}>{s === "Buka" ? "Buka antrean" : s === "Jeda" ? "Jeda antrean" : "Tutup antrean"}</button>)}</div>
      </section>
      <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5"><h3 className="font-extrabold">Antrean saat ini</h3><p className="mt-1 text-sm text-[#778274]">Contoh data tampilan; sambungkan ke API untuk data langsung.</p><div className="mt-4 space-y-3">{["SQP-001 · 2 pengunjung","SQP-002 · 1 pengunjung","SQP-003 · 3 pengunjung","SQP-004 · 2 pengunjung"].map((v,i)=><div key={v} className="flex items-center justify-between rounded-xl bg-[#F5F7F2] p-3"><div><p className="text-sm font-bold">{v}</p><p className="text-xs text-[#899285]">Posisi {i+1}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4D8B45]">Menunggu</span></div>)}</div></section>
    </div>}
    {tab === "inspection" && <section className="max-w-3xl rounded-2xl border border-[#E4EAE0] bg-white p-5"><h3 className="text-lg font-extrabold">Pemeriksaan pengunjung</h3><p className="mt-1 text-sm text-[#778274]">Masukkan nomor tiket atau Order Number secara manual untuk memeriksa tiket.</p><form className="mt-5 space-y-4" onSubmit={e => {e.preventDefault();setCheckResult(visitorCode.trim() ? `Nomor ${visitorCode} siap diverifikasi melalui backend.` : "Masukkan nomor tiket.");}}><label className="block text-sm font-semibold">Nomor tiket / Order Number<input value={visitorCode} onChange={e => setVisitorCode(e.target.value)} required placeholder="Contoh: SQP261102103019" className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-4 py-3"/></label><button className="rounded-xl bg-[#4D8B45] px-5 py-3 text-sm font-bold text-white">Periksa tiket</button></form>{checkResult && <p className="mt-4 rounded-xl bg-[#E8EFD9] p-4 text-sm text-[#3F783B]">{checkResult}</p>}</section>}
    {tab === "issues" && <section className="max-w-3xl rounded-2xl border border-[#E4EAE0] bg-white p-5"><h3 className="text-lg font-extrabold">Catat kendala tiket / antrean</h3><p className="mt-1 text-sm text-[#778274]">Catat kendala operasional untuk ditindaklanjuti.</p><form className="mt-5 space-y-4" onSubmit={e => {e.preventDefault();save("Kendala berhasil dicatat pada tampilan demo.");setIssue("");setIssueNote("");}}><label className="block text-sm font-semibold">Jenis kendala<select value={issue} onChange={e => setIssue(e.target.value)} required className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-4 py-3"><option value="">Pilih kendala</option><option>Tiket tidak ditemukan</option><option>Data tiket tidak sesuai</option><option>Masalah antrean</option><option>Kendala operasional aktivitas</option><option>Lainnya</option></select></label><label className="block text-sm font-semibold">Keterangan<textarea value={issueNote} onChange={e => setIssueNote(e.target.value)} required rows={4} placeholder="Jelaskan kendala yang terjadi..." className="mt-2 w-full rounded-xl border border-[#DCE4D8] px-4 py-3"/></label><button className="rounded-xl bg-[#4D8B45] px-5 py-3 text-sm font-bold text-white">Simpan kendala</button></form></section>}
    {tab === "history" && <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5"><h3 className="text-lg font-extrabold">Riwayat & laporan {attraction.name}</h3><p className="mt-1 text-sm text-[#778274]">Contoh struktur laporan; data aktual akan dimuat dari database.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#F5F7F2] text-xs uppercase text-[#778274]"><tr><th className="p-3">Waktu</th><th className="p-3">Aktivitas</th><th className="p-3">Petugas</th><th className="p-3">Status</th></tr></thead><tbody><tr className="border-b border-[#EDF0EA]"><td className="p-3">Hari ini · 09:00</td><td className="p-3">Antrean dibuka</td><td className="p-3">Administrator</td><td className="p-3 text-green-700">Berhasil</td></tr><tr><td className="p-3">Hari ini · 08:45</td><td className="p-3">Pemeriksaan tiket</td><td className="p-3">Staff</td><td className="p-3 text-green-700">Valid</td></tr></tbody></table></div></section>}
    {tab === "edit" && <section className="max-w-3xl rounded-2xl border border-[#E4EAE0] bg-white p-5"><h3 className="text-lg font-extrabold">Cari & edit tiket pengunjung</h3><p className="mt-1 text-sm text-[#778274]">Cari menggunakan Order Number, lalu sambungkan hasil pencarian ke API untuk mengubah data tiket.</p><form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={e => {e.preventDefault();setCheckResult(`Pencarian ${visitorCode} siap diproses oleh backend.`);}}><input value={visitorCode} onChange={e => setVisitorCode(e.target.value)} placeholder="Masukkan Order Number" className="min-w-0 flex-1 rounded-xl border border-[#DCE4D8] px-4 py-3"/><button className="rounded-xl bg-[#4D8B45] px-5 py-3 text-sm font-bold text-white">Cari tiket</button></form>{checkResult && <p className="mt-4 rounded-xl bg-[#E8EFD9] p-4 text-sm text-[#3F783B]">{checkResult}</p>}</section>}
  </div>;
}
