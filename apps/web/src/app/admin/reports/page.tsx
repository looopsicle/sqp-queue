export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Riwayat & Laporan</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Ringkasan aktivitas operasional dan pencatatan tiket.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Tiket tercatat", value: "128" },
          { label: "Pemeriksaan tiket", value: "96" },
          { label: "Kendala dilaporkan", value: "2" },
        ].map((x) => (
          <div
            key={x.label}
            className="rounded-2xl border border-[#E4EAE0] bg-white p-5"
          >
            <p className="text-sm text-[#778274]">{x.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{x.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E4EAE0] bg-white p-5">
        <h3 className="font-extrabold">Aktivitas terbaru</h3>
        <p className="mt-2 text-sm text-[#778274]">
          Belum ada data laporan yang terhubung. Setelah API tersedia, halaman
          ini dapat menampilkan filter tanggal, aktivitas, petugas, dan ekspor
          laporan.
        </p>
      </div>
    </div>
  );
}
