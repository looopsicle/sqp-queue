"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { WorkerQrAttractionId } from "../../data/dbTypes";
import { WorkerNavTab } from "./workerTypes";

interface WorkerSidebarProps {
  activeTab: WorkerNavTab;
  selectedAttraction: WorkerQrAttractionId;
  issuedQrCount: number;
  attractionLabel: string;
  workerName: string;
  avatarSrc: string;
  onSelectAttraction: (attractionId: WorkerQrAttractionId) => void;
  onSelectTab: (tab: WorkerNavTab) => void;
}

const RIDE_OPTIONS: {
  id: WorkerQrAttractionId;
  label: string;
}[] = [
  { id: "sqp-express", label: "🚂 SQP Express" },
  { id: "adventure-ropes", label: "🪂 Roll Glider" },
];

/**
 * Left navigation sidebar for the Worker Staff Portal (Figma 193:2989).
 */
export function WorkerSidebar({
  activeTab,
  selectedAttraction,
  issuedQrCount,
  attractionLabel,
  workerName,
  avatarSrc,
  onSelectAttraction,
  onSelectTab,
}: WorkerSidebarProps) {
  const navItems: { id: WorkerNavTab; label: string }[] = [
    { id: "beranda", label: "Beranda" },
    { id: "buat-tiket", label: "Buat Tiket (QR)" },
    { id: "daftar-qr", label: `Daftar QR (${issuedQrCount})` },
  ];

  return (
    <aside className="w-full md:w-[240px] bg-[#4D8B45] text-white flex flex-col justify-between shrink-0 shadow-md">
      <div className="p-4">
        <div className="flex items-center justify-between md:block">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#A8C943] text-[#183F2A] font-extrabold text-[15px] flex items-center justify-center shadow-xs">
                SQP
              </div>
              <div>
                <p className="font-extrabold text-[17px] leading-tight">
                  SQP Park
                </p>
                <p className="text-[11px] font-bold tracking-wider text-[#A8C943] uppercase">
                  STAFF PORTAL
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="md:hidden bg-white text-[#183F2A] font-bold text-[11px] px-3 py-1.5 rounded-xl"
          >
            ← Visitor App
          </Link>
        </div>

        <div className="hidden md:block h-px bg-[#38624B] my-4" />

        {/* Scope Notice Pill */}
        <div className="mt-3 md:mt-0 bg-[#38624B]/80 rounded-xl p-2.5 text-[11.5px] text-[#EDF6E8] leading-snug">
          <p className="font-bold text-[#F2C94C]">Cetak QR Klaim Tiket:</p>
          <p className="mt-0.5">
            Khusus <strong>SQP Express</strong> &amp;{" "}
            <strong>Roll Glider</strong>.
          </p>
        </div>

        {/* Ride Switcher (Only SQP Express & Roll Glider) */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-1 gap-1.5">
          {RIDE_OPTIONS.map((ride) => {
            const isSelected = selectedAttraction === ride.id;
            return (
              <button
                key={ride.id}
                type="button"
                onClick={() => onSelectAttraction(ride.id)}
                className={`px-3 py-2 rounded-xl text-left text-[13px] font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-white text-[#183F2A]"
                    : "bg-[#38624B]/60 text-white hover:bg-[#38624B]"
                }`}
              >
                <span>{ride.label}</span>
                {isSelected && (
                  <span className="text-[10px] bg-[#A8C943] px-1.5 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[#38624B] my-4 hidden md:block" />

        {/* Main Staff Menu */}
        <nav className="mt-3 md:mt-0 flex md:flex-col gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-4 py-2.5 rounded-[11px] text-left text-[14.5px] transition-colors shrink-0 cursor-pointer ${
                activeTab === item.id
                  ? "bg-[#A8C943] text-white font-bold"
                  : "text-white hover:bg-[#38624B]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Worker Identity */}
      <div className="hidden md:block p-4 border-t border-[#38624B] space-y-3">
        <p className="font-bold text-[12px] tracking-wider text-[#A8C943] uppercase">
          PETUGAS WAHANA
        </p>
        <div className="flex items-center gap-2.5">
          <Image
            src={avatarSrc}
            alt={workerName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover bg-white"
          />
          <div className="min-w-0">
            <p className="font-bold text-[14px] text-white truncate">
              {workerName}
            </p>
            <p className="text-[11px] text-[#E8EFD9] truncate">
              {attractionLabel}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="block w-full text-center bg-white hover:bg-[#EDF6E8] text-[#183F2A] font-bold text-[14px] py-2.5 rounded-[11px] border border-[#DFE8DD] transition-colors"
        >
          ← Halaman Visitor
        </Link>
      </div>
    </aside>
  );
}
