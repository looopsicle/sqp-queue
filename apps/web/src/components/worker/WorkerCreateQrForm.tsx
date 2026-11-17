"use client";

import React from "react";
import { WorkerQrAttractionId } from "../../data/dbTypes";
import { BUNDLING_OPTIONS, WorkerReceiptMode } from "./workerTypes";

interface WorkerCreateQrFormProps {
  selectedAttraction: WorkerQrAttractionId;
  formAttractionTitle: string;
  issuedQrCount: number;
  receiptMode: WorkerReceiptMode;
  posReceiptNumber: string;
  selectedBundling: string;
  adultCount: number;
  childCount: number;
  isSubmitting: boolean;
  formError: string | null;
  onChangeReceiptMode: (mode: WorkerReceiptMode) => void;
  onChangePosReceiptNumber: (value: string) => void;
  onGenerateSampleReceipt: () => void;
  onChangeBundling: (label: string) => void;
  onChangeAdultCount: (updater: (prev: number) => number) => void;
  onChangeChildCount: (updater: (prev: number) => number) => void;
  onOpenDaftarQr: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface ParticipantStepperProps {
  label: string;
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function ParticipantStepper({
  label,
  count,
  onDecrement,
  onIncrement,
}: ParticipantStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#F7F9F6] sm:bg-transparent p-3 sm:p-0 rounded-xl">
      <span className="font-semibold text-[15px] text-[#617368]">{label}</span>
      <div className="flex items-center bg-white border border-[#DFE8DD] rounded-[9px] h-[47px] px-2 gap-3">
        <button
          type="button"
          onClick={onDecrement}
          className="w-7 h-7 rounded-md bg-[#F7F9F6] hover:bg-[#EDF6E8] font-bold text-[16px] text-[#183F2A] cursor-pointer"
        >
          −
        </button>
        <span className="w-6 text-center font-bold text-[16px] text-[#263A2F]">
          {count}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-7 h-7 rounded-md bg-[#F7F9F6] hover:bg-[#EDF6E8] font-bold text-[16px] text-[#183F2A] cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Ticket creation form for issuing POS-backed Worker QR claim codes
 * for SQP Express and Roll Glider (Figma 193:2988 & 193:3050).
 */
export function WorkerCreateQrForm({
  selectedAttraction,
  formAttractionTitle,
  issuedQrCount,
  receiptMode,
  posReceiptNumber,
  selectedBundling,
  adultCount,
  childCount,
  isSubmitting,
  formError,
  onChangeReceiptMode,
  onChangePosReceiptNumber,
  onGenerateSampleReceipt,
  onChangeBundling,
  onChangeAdultCount,
  onChangeChildCount,
  onOpenDaftarQr,
  onSubmit,
}: WorkerCreateQrFormProps) {
  const totalParticipants = adultCount + childCount;

  return (
    <div className="space-y-5">
      {/* Info Card Banner (Figma 193:3020) */}
      <div className="bg-[#EDF6E8]/70 border border-[#DFE8DD] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[17px] text-[#183F2A]">
            Sesuaikan data pada struk POS
          </h2>
          <p className="text-[13.5px] text-[#263A2F] mt-0.5">
            Pastikan transaksi telah dibayar. Satu nomor struk tidak boleh
            diterbitkan dua kali.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDaftarQr}
          className="bg-white hover:bg-[#F7F9F6] border border-[#DFE8DD] text-[#183F2A] font-bold text-[14px] px-5 py-2.5 rounded-[11px] shrink-0 cursor-pointer"
        >
          Lihat Daftar QR ({issuedQrCount})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Form Card (Figma 193:3023 / 193:3085) */}
        <form
          onSubmit={onSubmit}
          className="lg:col-span-8 bg-white border border-[#DFE8DD] rounded-[16px] p-5 md:p-6 space-y-5"
        >
          <div>
            <h3 className="font-bold text-[21px] text-[#183F2A]">Data tiket</h3>
            <p className="text-[14px] text-[#617368] mt-0.5">
              Wahana aktif: <strong>{formAttractionTitle}</strong>
            </p>
          </div>

          {/* Radio Toggle: Nomor struk POS vs Tiket Bundling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between text-[14px] font-semibold text-[#617368] mb-1.5">
                <span className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="receiptMode"
                    checked={receiptMode === "pos"}
                    onChange={() => onChangeReceiptMode("pos")}
                    className="accent-[#4D8B45] w-4 h-4"
                  />
                  Nomor struk POS *
                </span>
                <button
                  type="button"
                  onClick={onGenerateSampleReceipt}
                  className="text-[11.5px] font-bold text-[#4D8B45] hover:underline cursor-pointer"
                >
                  + Nomor Acak
                </button>
              </label>
              <input
                type="text"
                disabled={receiptMode !== "pos"}
                value={posReceiptNumber}
                onChange={(e) => onChangePosReceiptNumber(e.target.value)}
                placeholder={
                  selectedAttraction === "sqp-express"
                    ? "contoh: SQP-6584"
                    : "contoh: 4821"
                }
                className={`w-full h-[47px] px-3.5 rounded-[9px] border text-[15px] font-semibold transition-colors ${
                  receiptMode === "pos"
                    ? "bg-white border-[#DFE8DD] text-[#263A2F]"
                    : "bg-[#E8E8E8] border-[#DFE8DD] text-[#617368]"
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[14px] font-semibold text-[#617368] mb-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="receiptMode"
                  checked={receiptMode === "bundling"}
                  onChange={() => onChangeReceiptMode("bundling")}
                  className="accent-[#4D8B45] w-4 h-4"
                />
                Gunakan Tiket Bundling *
              </label>
              <select
                disabled={receiptMode !== "bundling"}
                value={selectedBundling}
                onChange={(e) => onChangeBundling(e.target.value)}
                className={`w-full h-[47px] px-3 rounded-[9px] border text-[14px] font-semibold transition-colors ${
                  receiptMode === "bundling"
                    ? "bg-white border-[#DFE8DD] text-[#263A2F]"
                    : "bg-[#D2D4D2] border-[#DFE8DD] text-[#263A2F]"
                }`}
              >
                {BUNDLING_OPTIONS.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Card when Roll Glider is selected (Figma 193:3050) */}
          {selectedAttraction === "adventure-ropes" && (
            <div className="bg-[#F7F9F6] border border-[#DFE8DD] rounded-[12px] p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-[16px] text-[#183F2A]">
                    Aktivitas: Roll Glider
                  </p>
                  <p className="text-[12.5px] text-[#617368]">
                    QR Petugas diaktifkan khusus untuk Roll Glider &amp; SQP
                    Express
                  </p>
                </div>
                <span className="bg-[#EDF6E8] text-[#4D8B45] font-bold text-[12px] px-3 py-1 rounded-full">
                  POS QR Aktif
                </span>
              </div>
            </div>
          )}

          {/* Participant Steppers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ParticipantStepper
              label="Jumlah dewasa *"
              count={adultCount}
              onDecrement={() => onChangeAdultCount((v) => Math.max(0, v - 1))}
              onIncrement={() => onChangeAdultCount((v) => v + 1)}
            />
            <ParticipantStepper
              label="Jumlah anak *"
              count={childCount}
              onDecrement={() => onChangeChildCount((v) => Math.max(0, v - 1))}
              onIncrement={() => onChangeChildCount((v) => v + 1)}
            />
          </div>

          {/* Verification Notice (Figma 193:3035) */}
          <div className="bg-[#DFDFDF] rounded-[10px] px-4 py-3.5 flex items-center gap-3 text-[#183F2A]">
            <span className="w-6 h-6 rounded-full border border-[#183F2A] flex items-center justify-center font-bold text-[13px] shrink-0">
              !
            </span>
            <p className="text-[14px]">
              Periksa kesesuaian jumlah tiket dengan struk POS.
            </p>
          </div>

          {formError && (
            <div className="bg-[#FDECE9] border border-[#C94B3C]/40 text-[#9B2C20] rounded-[10px] px-4 py-3 text-[13.5px] font-semibold">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || totalParticipants === 0}
            className="w-full h-[53px] bg-[#4D8B45] hover:bg-[#3d7236] disabled:opacity-50 text-white font-bold text-[16px] rounded-[11px] shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting
              ? "Menyimpan ke Database & Membuat QR..."
              : "Periksa & Buat Tiket"}
          </button>
        </form>

        {/* Right Transaction Summary Card (Figma 193:3039) */}
        <div className="lg:col-span-4 bg-white border border-[#DFE8DD] rounded-[16px] p-5 md:p-6 space-y-4">
          <h3 className="font-bold text-[19px] text-[#183F2A]">
            Ringkasan transaksi
          </h3>

          <div className="pt-2 border-b border-[#DFE8DD] pb-4">
            <p className="text-[14px] text-[#617368]">Nomor struk</p>
            <p className="font-bold text-[16px] text-[#263A2F] mt-1">
              {receiptMode === "pos"
                ? posReceiptNumber || "-"
                : "Paket Bundling Otomatis"}
            </p>
          </div>

          <div className="border-b border-[#DFE8DD] pb-4">
            <p className="text-[14px] text-[#617368]">Total peserta</p>
            <p className="font-bold text-[29px] text-[#183F2A] mt-1 flex items-center gap-2">
              <span>{totalParticipants} orang</span>
              <span className="text-[22px]">👥</span>
            </p>
            <p className="text-[15px] text-[#263A2F] mt-1">
              {adultCount} dewasa · {childCount} anak
            </p>
          </div>

          <div className="text-[12.5px] text-[#617368]">
            Setelah dibuat, QR tersimpan di database dengan status{" "}
            <strong className="text-[#4D8B45]">AVAILABLE</strong> hingga
            dipindai visitor.
          </div>
        </div>
      </div>
    </div>
  );
}
