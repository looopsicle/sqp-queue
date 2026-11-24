
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Beranda" },
  { href: "/admin/attractions", label: "Atraksi" },
  { href: "/admin/tickets", label: "Buat QR Ticket" },
  { href: "/admin/queues", label: "Monitoring" },
  { href: "/admin/accounts", label: "Pemeriksaan" },
  { href: "/admin/reports", label: "Riwayat" },
];

// Page title and subtitle 
function getPageInfo(pathname: string) {
  if (pathname === "/admin") {
    return {
      title: "Beranda Petugas",
      subtitle: "Operasional SQP Express",
    };
  }

  if (pathname.startsWith("/admin/attractions")) {
    return {
      title: "Manajemen Atraksi",
      subtitle: "Kelola informasi dan operasional atraksi",
    };
  }

  if (pathname.startsWith("/admin/tickets")) {
    return {
      title: "Buat QR Ticket",
      subtitle: "Penerbitan dan pengelolaan tiket pengunjung",
    };
  }

  if (pathname.startsWith("/admin/queues")) {
    return {
      title: "Monitoring Antrean",
      subtitle: "Pantau antrean dan aktivitas pengunjung",
    };
  }

  if (pathname.startsWith("/admin/accounts")) {
    return {
      title: "Pemeriksaan Pengunjung",
      subtitle: "Informasi dan data akun pengunjung",
    };
  }

  if (pathname.startsWith("/admin/reports")) {
    return {
      title: "Riwayat & Laporan",
      subtitle: "Riwayat aktivitas dan laporan operasional",
    };
  }

  return {
    title: "Staff Portal",
    subtitle: "Scientia Square Park",
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const pageInfo = getPageInfo(pathname);

  // Login page
  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#263B29] md:flex">

      {/* SIDEBAR */}
      <aside className="
        flex w-full flex-col bg-[#4D8B45] px-5 py-6 text-white
        md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-64
      ">

        {/* LOGO */}
        <Link href="/admin" className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl font-bold">
            SQP
          </span>

          <span>
            <span className="block text-lg font-extrabold tracking-wide">
              SQP PARK
            </span>
            <span className="block text-xs text-white/75">
              STAFF PORTAL
            </span>
          </span>
        </Link>

        <div className="mb-3 border-t border-white/20 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-white/60">
          Menu utama
        </div>

        {/* NAVIGATION */}
        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {links.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center rounded-xl px-3 py-3 text-sm font-semibold transition
                  ${
                    active
                      ? "bg-[#A5C83F] text-white shadow-sm"
                      : "text-white/90 hover:bg-white/15"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* STAFF PROFILE */}
        <div className="mt-8 pt-4 md:mt-auto">

          <div className="mb-4 border-b border-white/25 pb-3"> </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="
              grid h-11 w-11 shrink-0 place-items-center
              rounded-full bg-white/20 text-2xl
            ">
              img
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                Kevin.SQPExpress
              </p>
            </div>
          </div>

          {/* LOGOUT */}
          <Link
            href="/admin/login"
            className="
              block w-full rounded-xl bg-white px-4 py-3
              text-center text-sm font-bold text-[#263B29]
              transition hover:bg-[#E8F0E3]
            "
          >
            Keluar Akun
          </Link>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="
        min-h-screen w-full px-4 py-6
        md:ml-64 md:px-9 md:py-8
      ">

        {/* PAGE HEADER */}
        <header className="
          mb-7 flex items-center justify-between
          border-b border-[#E3E9DF] pb-5
        ">
          <div>
            <h1 className="text-xl font-extrabold md:text-2xl">
              {pageInfo.title}
            </h1>

            <p className="mt-1 text-sm text-[#789071] md:text-base">
              {pageInfo.subtitle}
            </p>
          </div>

          {/* TOP RIGHT INTENTIONALLY EMPTY */}

        </header>

        {/* CURRENT PAGE */}
        {children}

      </main>
    </div>
  );
}
