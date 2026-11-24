import Link from "next/link";
import { ADMIN_ATTRACTIONS } from "../../../data/adminData";

export default function QueuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Monitoring Antrean</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Pantau antrean berdasarkan aktivitas.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4EAE0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#F5F7F2] text-xs uppercase text-[#778274]">
              <tr>
                <th className="p-4">Aktivitas</th>
                <th className="p-4">Antrean aktif</th>
                <th className="p-4">Kapasitas</th>
                <th className="p-4">Status</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_ATTRACTIONS.map((a, i) => (
                <tr key={a.id} className="border-t border-[#EDF0EA]">
                  <td className="p-4 font-bold">{a.name}</td>
                  <td className="p-4">{[8, 5, 3][i]} pengunjung</td>
                  <td className="p-4">{a.capacity}</td>
                  <td className="p-4">{a.status}</td>
                  <td className="p-4">
                    <Link
                      className="font-bold text-[#4D8B45]"
                      href={`/admin/attractions/${a.id}`}
                    >
                      Kelola →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#899285]">
        Angka antrean merupakan data contoh. Gunakan API/database untuk
        monitoring real-time.
      </p>
    </div>
  );
}
