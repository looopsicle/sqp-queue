"use client";

import React from "react";
import { WorkerQrTicketRecord } from "../../data/dbTypes";

interface WorkerQrListViewProps {
  issuedQrs: WorkerQrTicketRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectQr: (qr: WorkerQrTicketRecord) => void;
  onDownloadPng: (qr: WorkerQrTicketRecord) => void;
}

/**
 * List of generated Worker QR tickets persisted in the database with
 * live claim status, inspect, and PNG download actions.
 */
export function WorkerQrListView({
  issuedQrs,
  isLoading,
  onRefresh,
  onSelectQr,
  onDownloadPng,
}: WorkerQrListViewProps) {
  return (
    <div className="bg-white border border-[#DFE8DD] rounded-[16px] p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[19px] text-[#183F2A]">
            Daftar QR Klaim di Database ({issuedQrs.length})
          </h2>
          <p className="text-[13px] text-[#617368]">
            Otomatis diperbarui saat visitor memindai QR ke akun mereka.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="bg-[#EDF6E8] hover:bg-[#d7e9cd] text-[#183F2A] font-bold text-[13px] px-4 py-2 rounded-xl cursor-pointer"
        >
          ↻ Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-[14px] text-[#617368]">Memuat database...</p>
      ) : issuedQrs.length === 0 ? (
        <p className="text-[14px] text-[#617368]">
          Belum ada QR tiket yang dibuat.
        </p>
      ) : (
        <div className="space-y-3">
          {issuedQrs.map((qr) => (
            <div
              key={qr.id}
              className="border border-[#DFE8DD] rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F9F6]/60"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[15px] text-[#183F2A]">
                    {qr.activityName}
                  </span>
                  <span className="bg-[#EDF6E8] text-[#183F2A] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                    POS #{qr.posReceiptNumber}
                  </span>
                  <span
                    className={`text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                      qr.status === "AVAILABLE" ? "bg-[#4D8B45]" : "bg-[#F28C28]"
                    }`}
                  >
                    {qr.status}
                  </span>
                </div>
                <p className="font-mono text-[12.5px] font-bold text-[#263A2F]">
                  {qr.claimCode}
                </p>
                <p className="text-[12.5px] text-[#617368]">
                  {qr.totalParticipants} orang ({qr.adultCount} dewasa ·{" "}
                  {qr.childCount} anak)
                  {qr.claimedByUsername
                    ? ` • Diklaim oleh: ${qr.claimedByUsername}`
                    : " • Belum diklaim"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectQr(qr)}
                  className="bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[13px] px-4 py-2 rounded-xl cursor-pointer"
                >
                  Tampilkan QR
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadPng(qr)}
                  className="bg-white hover:bg-[#EDF6E8] border border-[#DFE8DD] text-[#183F2A] font-bold text-[13px] px-3 py-2 rounded-xl cursor-pointer"
                >
                  PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
