"use client";

import React from "react";
import { WorkerQrTicketRecord } from "../../data/dbTypes";
import { DEFAULT_LAN_HOST, buildClaimUrl } from "../../utils/qrTicketCodec";
import { QrMatrixSvg } from "../QrMatrixSvg";

interface WorkerQrResultViewProps {
  activeQr: WorkerQrTicketRecord;
  targetLanOrigin: string;
  onChangeTargetLanOrigin: (value: string) => void;
  onOpenPrintModal: () => void;
  onDownloadPng: (qr: WorkerQrTicketRecord) => void;
  onCopyText: (text: string, toastMessage: string) => void;
  onResetAndStartNew: () => void;
}

/**
 * Generated Worker QR claim ticket view with editable LAN origin,
 * copy/download/print controls, and ticket details (Figma 193:3170 & 193:3568).
 */
export function WorkerQrResultView({
  activeQr,
  targetLanOrigin,
  onChangeTargetLanOrigin,
  onOpenPrintModal,
  onDownloadPng,
  onCopyText,
  onResetAndStartNew,
}: WorkerQrResultViewProps) {
  const claimUrl = buildClaimUrl(activeQr.claimCode, targetLanOrigin);

  return (
    <div className="space-y-5">
      {/* Green Info Banner */}
      <div className="bg-[#EDF6E8] border border-[#A8C943]/60 rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[18px] text-[#183F2A]">
            Tiket berhasil dibuat
          </h2>
          <p className="text-[14px] text-[#263A2F] mt-0.5">
            Tunjukkan QR ini kepada pengunjung untuk klaim tiket ke akun mereka.
          </p>
        </div>
        <span
          className={`px-3.5 py-1 rounded-full font-extrabold text-[12px] ${
            activeQr.status === "AVAILABLE"
              ? "bg-[#4D8B45] text-white"
              : "bg-[#F28C28] text-white"
          }`}
        >
          Status: {activeQr.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left QR Claim Card (Figma 193:3207 / 193:3605) */}
        <div className="lg:col-span-6 bg-white border border-[#DFE8DD] rounded-[16px] p-6 flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <h3 className="font-bold text-[20px] text-[#183F2A]">
              QR Klaim Tiket
            </h3>
            <p className="text-[14px] text-[#617368] mt-1">
              Pindai melalui halaman klaim tiket pengunjung
            </p>
          </div>

          <div className="my-5 p-4 bg-white border-2 border-[#DFE8DD] rounded-2xl shadow-xs">
            <QrMatrixSvg value={claimUrl} size={236} />
          </div>

          <div className="w-full space-y-3">
            <div className="bg-[#F7F9F6] border border-[#DFE8DD] rounded-xl p-2.5 text-left space-y-1.5">
              <label className="block text-[11px] font-bold text-[#617368]">
                Target URL / Host untuk Scan HP
              </label>
              <input
                type="text"
                value={targetLanOrigin}
                onChange={(e) => onChangeTargetLanOrigin(e.target.value)}
                placeholder={`http://${DEFAULT_LAN_HOST}:3000`}
                className="w-full h-[36px] px-2.5 rounded-lg border border-[#DFE8DD] bg-white font-mono text-[12px] font-bold text-[#183F2A]"
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <a
                  href={claimUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-[#4D8B45] hover:underline truncate"
                >
                  {claimUrl}
                </a>
                <button
                  type="button"
                  onClick={() => onCopyText(claimUrl, "Link QR klaim disalin!")}
                  className="text-[11px] font-bold text-[#4D8B45] hover:underline shrink-0 cursor-pointer"
                >
                  Salin URL
                </button>
              </div>
            </div>

            <div className="bg-[#F7F9F6] border border-[#DFE8DD] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <code className="font-mono font-bold text-[13px] text-[#183F2A] truncate">
                {activeQr.claimCode}
              </code>
              <button
                type="button"
                onClick={() =>
                  onCopyText(activeQr.claimCode, "Kode klaim disalin!")
                }
                className="text-[12px] font-bold text-[#4D8B45] hover:underline shrink-0 cursor-pointer"
              >
                Salin
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenPrintModal}
                className="h-[48px] bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[15px] rounded-[11px] cursor-pointer"
              >
                Cetak QR Klaim
              </button>
              <button
                type="button"
                onClick={() => onDownloadPng(activeQr)}
                className="h-[48px] bg-[#EDF6E8] hover:bg-[#dceccf] text-[#183F2A] font-bold text-[14px] rounded-[11px] border border-[#A8C943]/50 cursor-pointer"
              >
                Download PNG QR
              </button>
            </div>
          </div>
        </div>

        {/* Right Detail Card (Figma 193:3550 / 193:3956) */}
        <div className="lg:col-span-6 bg-white border border-[#DFE8DD] rounded-[16px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[20px] text-[#183F2A] mb-4">
              Detail tiket
            </h3>

            <div className="divide-y divide-[#DFE8DD] text-[15px]">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-[#617368]">Wahana</span>
                <span className="font-bold text-[#183F2A] text-right">
                  {activeQr.activityName}
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-[#617368]">Nomor struk POS</span>
                <span className="font-bold text-[#183F2A] text-right">
                  {activeQr.posReceiptNumber}
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-[#617368]">Jumlah peserta</span>
                <span className="font-bold text-[#183F2A] text-right">
                  {activeQr.totalParticipants} orang · {activeQr.adultCount}{" "}
                  dewasa / {activeQr.childCount} anak
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-[#617368]">Status tiket</span>
                <span
                  className={`font-extrabold ${
                    activeQr.status === "AVAILABLE"
                      ? "text-[#4D8B45]"
                      : "text-[#F28C28]"
                  }`}
                >
                  {activeQr.status}
                  {activeQr.claimedByUsername
                    ? ` (oleh ${activeQr.claimedByUsername})`
                    : ""}
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-[#617368]">QR digunakan untuk</span>
                <span className="font-bold text-[#183F2A] text-right">
                  Klaim tiket
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <button
              type="button"
              onClick={onResetAndStartNew}
              className="w-full h-[50px] bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[15px] rounded-[11px] cursor-pointer"
            >
              Selesai — Buat Tiket Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
