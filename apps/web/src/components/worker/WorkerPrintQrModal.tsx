"use client";

import React from "react";
import { WorkerQrTicketRecord } from "../../data/dbTypes";
import { buildClaimUrl } from "../../utils/qrTicketCodec";
import { QrMatrixSvg } from "../QrMatrixSvg";

interface WorkerPrintQrModalProps {
  qr: WorkerQrTicketRecord;
  targetLanOrigin: string;
  onDownloadPng: (qr: WorkerQrTicketRecord) => void;
  onClose: () => void;
}

/**
 * Print & PNG export modal for a newly issued Worker QR ticket (Figma 193:4931 & 193:5277).
 */
export function WorkerPrintQrModal({
  qr,
  targetLanOrigin,
  onDownloadPng,
  onClose,
}: WorkerPrintQrModalProps) {
  const claimUrl = buildClaimUrl(qr.claimCode, targetLanOrigin);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-[460px] rounded-[24px] p-6 text-center shadow-2xl border border-[#DFE8DD]">
        <h2 className="font-bold text-[22px] text-[#183F2A]">
          Cetak QR Klaim Tiket
        </h2>
        <p className="text-[14px] text-[#617368] mt-1">
          {qr.activityName} · Nomor struk {qr.posReceiptNumber}
        </p>

        <div className="my-5 flex justify-center">
          <div className="p-3 border border-[#DFE8DD] rounded-2xl bg-white">
            <QrMatrixSvg value={claimUrl} size={220} />
          </div>
        </div>

        <p className="font-mono font-bold text-[13px] text-[#183F2A]">
          {qr.claimCode}
        </p>
        <p className="font-mono text-[11px] text-[#4D8B45] break-all mt-1">
          {claimUrl}
        </p>
        <p className="text-[13px] text-[#617368] mt-1">
          QR khusus klaim tiket pengunjung ({qr.totalParticipants} orang).
        </p>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => onDownloadPng(qr)}
            className="w-full h-[48px] bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[15px] rounded-[11px] cursor-pointer"
          >
            Download PNG QR (Untuk Scan)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full h-[46px] bg-[#EDF6E8] hover:bg-[#dceccf] text-[#183F2A] font-bold text-[15px] rounded-[11px] cursor-pointer"
          >
            Cetak via Printer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-[44px] bg-white border border-[#DFE8DD] text-[#617368] font-bold text-[14px] rounded-[11px] cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
