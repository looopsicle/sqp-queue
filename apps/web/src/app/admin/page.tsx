import Link from "next/link";
import { ADMIN_ATTRACTIONS } from "../../data/adminData";

// Dummy data for history & laporan screen
const stats = [
  { label: "Tiket hari ini", value: "128", note: "+12% dari kemarin" },
  { label: "Antrean aktif", value: "45", note: "3 aktivitas" },
  { label: "Pengunjung diperiksa", value: "96", note: "Hari ini" },
  { label: "Kendala tercatat", value: "2", note: "Perlu ditinjau" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-7">
      <section>
        <h2 className="text-2xl font-extrabold">Beranda</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Ringkasan operasional Scientia Square Park.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-[#788275]">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{s.value}</p>
            <p className="mt-2 text-xs text-[#4D8B45]">{s.note}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Aktivitas</h3>
            <p className="text-sm text-[#778274]">
              Pilih aktivitas untuk mengelola tiket dan antrean.
            </p>
          </div>
          <Link
            href="/admin/attractions"
            className="text-sm font-bold text-[#4D8B45]"
          >
            Lihat semua →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {ADMIN_ATTRACTIONS.map((a) => (
            <Link
              key={a.id}
              href={`/admin/attractions/${a.id}`}
              className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-lg bg-[#E8EFD9] px-3 py-2 text-xs font-bold text-[#4D8B45]">
                  {a.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    a.status === "Buka"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <h4 className="mt-5 text-xl font-extrabold">{a.name}</h4>
              <p className="mt-1 text-sm text-[#778274]">{a.description}</p>
              <div className="mt-5 border-t border-[#EDF0EA] pt-4 text-sm font-bold text-[#4D8B45]">
                Kelola aktivitas →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E4EAE0] bg-white p-5">
        <h3 className="font-extrabold">Akses cepat</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-xl bg-[#4D8B45] px-4 py-3 text-sm font-bold text-white"
            href="/admin/tickets"
          >
            + Input tiket manual
          </Link>
          <Link
            className="rounded-xl bg-[#E8EFD9] px-4 py-3 text-sm font-bold text-[#3F783B]"
            href="/admin/queues"
          >
            Monitoring antrean
          </Link>
          <Link
            className="rounded-xl bg-[#E8EFD9] px-4 py-3 text-sm font-bold text-[#3F783B]"
            href="/admin/reports"
          >
            Riwayat & laporan
          </Link>
        </div>
      </section>
    </div>
  );
}
