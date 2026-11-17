"use client";

import React from "react";
import { WorkerQrTicketRecord } from "../../data/dbTypes";
import { WorkerNavTab } from "./workerTypes";

interface WorkerTopBarProps {
  activeTab: WorkerNavTab;
  activeQr: WorkerQrTicketRecord | null;
  attractionLabel: string;
  headerBadgeLabel: string;
  onClearActiveQr: () => void;
}

/**
 * Top app bar for the Worker Staff Portal (Figma 193:3014).
 */
export function WorkerTopBar({
  activeTab,
  activeQr,
  attractionLabel,
  headerBadgeLabel,
  onClearActiveQr,
}: WorkerTopBarProps) {
  const title = activeQr
    ? "QR Klaim Tiket"
    : activeTab === "daftar-qr"
    ? `Daftar QR Terbit — ${attractionLabel}`
    : activeTab === "beranda"
    ? "Beranda Petugas Wahana"
    : `Buat Tiket — ${attractionLabel}`;

  const subtitle = activeQr
    ? "Tiket berhasil diterbitkan dan siap diklaim visitor via Scan QR"
    : "Transaksi dari struk POS; pembayaran tetap di POS SQP";

  return (
    <header className="bg-white border-b border-[#DFE8DD] px-5 md:px-7 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {activeQr && (
          <button
            type="button"
            onClick={onClearActiveQr}
            className="bg-[#F7F9F6] hover:bg-[#EDF6E8] border border-[#DFE8DD] text-[#183F2A] font-bold text-[13.5px] px-4 py-2 rounded-xl cursor-pointer"
          >
            ← Kembali
          </button>
        )}
        <div>
          <h1 className="font-bold text-[21px] md:text-[24px] text-[#183F2A] leading-tight">
            {title}
          </h1>
          <p className="text-[13.5px] text-[#617368] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="bg-[#EDF6E8] text-[#183F2A] font-bold text-[13px] px-4 py-1.5 rounded-full">
          {headerBadgeLabel}
        </span>
      </div>
    </header>
  );
}
