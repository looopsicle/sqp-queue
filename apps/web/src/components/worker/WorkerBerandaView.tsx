"use client";

import React from "react";
import { WorkerQrAttractionId } from "../../data/dbTypes";

interface WorkerBerandaViewProps {
  availableCount: number;
  claimedCount: number;
  onStartCreateQr: (attractionId: WorkerQrAttractionId) => void;
}

/**
 * Worker homepage summary metrics and quick QR creation shortcuts.
 */
export function WorkerBerandaView({
  availableCount,
  claimedCount,
  onStartCreateQr,
}: WorkerBerandaViewProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DFE8DD] rounded-[16px] p-5">
          <p className="text-[13px] font-semibold text-[#617368]">
            QR Siap Diklaim (AVAILABLE)
          </p>
          <p className="text-[32px] font-extrabold text-[#4D8B45] mt-1">
            {availableCount} QR
          </p>
          <p className="text-[12px] text-[#617368] mt-1">
            Menunggu dipindai oleh visitor
          </p>
        </div>

        <div className="bg-white border border-[#DFE8DD] rounded-[16px] p-5">
          <p className="text-[13px] font-semibold text-[#617368]">
            QR Sudah Diklaim (CLAIMED)
          </p>
          <p className="text-[32px] font-extrabold text-[#183F2A] mt-1">
            {claimedCount} QR
          </p>
          <p className="text-[12px] text-[#617368] mt-1">
            Sudah masuk ke akun visitor
          </p>
        </div>

        <div className="bg-white border border-[#DFE8DD] rounded-[16px] p-5">
          <p className="text-[13px] font-semibold text-[#617368]">
            Cakupan Wahana QR POS
          </p>
          <p className="text-[18px] font-extrabold text-[#183F2A] mt-2">
            SQP Express &amp; Roll Glider
          </p>
          <p className="text-[12px] text-[#617368] mt-1">
            Wall Climbing gratis langsung dari aplikasi visitor
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#DFE8DD] rounded-[16px] p-6 space-y-4">
        <h2 className="font-bold text-[19px] text-[#183F2A]">
          Aksi Cepat Petugas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onStartCreateQr("sqp-express")}
            className="bg-[#4D8B45] hover:bg-[#3e7237] text-white font-bold text-[15px] py-4 px-5 rounded-[12px] cursor-pointer text-left"
          >
            🚂 Buat QR Tiket SQP Express →
          </button>
          <button
            type="button"
            onClick={() => onStartCreateQr("adventure-ropes")}
            className="bg-[#4D8B45] hover:bg-[#3e7237] text-white font-bold text-[15px] py-4 px-5 rounded-[12px] cursor-pointer text-left"
          >
            🪂 Buat QR Tiket Roll Glider →
          </button>
        </div>
      </div>
    </div>
  );
}
