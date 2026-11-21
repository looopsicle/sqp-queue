import Link from "next/link";
import { ADMIN_ATTRACTIONS } from "../../../data/adminData";

export default function AttractionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Aktivitas</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Pilih aktivitas untuk membuka monitoring, pemeriksaan tiket, kendala,
          dan riwayat.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ADMIN_ATTRACTIONS.map((a) => (
          <Link
            key={a.id}
            href={`/admin/attractions/${a.id}`}
            className="rounded-2xl border border-[#E4EAE0] bg-white p-5 shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between">
              <span className="rounded-lg bg-[#E8EFD9] px-3 py-2 text-xs font-bold text-[#4D8B45]">
                {a.category}
              </span>
              <span className="text-xs font-bold text-[#4D8B45]">
                {a.status}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-extrabold">{a.name}</h3>
            <p className="mt-2 text-sm text-[#778274]">{a.description}</p>
            <p className="mt-5 text-sm font-bold text-[#4D8B45]">
              Buka pengelolaan →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
