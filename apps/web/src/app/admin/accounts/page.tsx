const accounts = [
  {
    name: "Guest Example",
    email: "guest@example.com",
    tickets: 2,
    status: "Aktif",
  },
  {
    name: "Visitor Demo",
    email: "visitor@example.com",
    tickets: 1,
    status: "Aktif",
  },
];

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Data Pengunjung</h2>
        <p className="mt-1 text-sm text-[#778274]">
          Daftar akun pengunjung yang terdaftar.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E4EAE0] bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="bg-[#F5F7F2] text-xs uppercase text-[#778274]">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Jumlah tiket</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email} className="border-t border-[#EDF0EA]">
                  <td className="p-3 font-semibold">{a.name}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.tickets}</td>
                  <td className="p-3 text-green-700">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[#899285]">Data contoh.</p>
      </div>
    </div>
  );
}
