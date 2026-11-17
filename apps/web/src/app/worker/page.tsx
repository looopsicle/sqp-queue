"use client";

import React, { useCallback, useEffect, useState } from "react";
import { WorkerQrAttractionId, WorkerQrTicketRecord } from "../../data/dbTypes";
import {
  DEFAULT_LAN_HOST,
  renderQrTicketCardPngDataUrl,
} from "../../utils/qrTicketCodec";
import {
  BUNDLING_OPTIONS,
  WorkerNavTab,
  WorkerReceiptMode,
  getWorkerAttractionMeta,
} from "../../components/worker/workerTypes";
import { WorkerSidebar } from "../../components/worker/WorkerSidebar";
import { WorkerTopBar } from "../../components/worker/WorkerTopBar";
import { WorkerBerandaView } from "../../components/worker/WorkerBerandaView";
import { WorkerCreateQrForm } from "../../components/worker/WorkerCreateQrForm";
import { WorkerQrResultView } from "../../components/worker/WorkerQrResultView";
import { WorkerQrListView } from "../../components/worker/WorkerQrListView";
import { WorkerPrintQrModal } from "../../components/worker/WorkerPrintQrModal";

/**
 * Staff Portal container managing Worker QR ticket generation and listing
 * for SQP Express and Roll Glider.
 */
export default function WorkerPortalPage() {
  const [activeTab, setActiveTab] = useState<WorkerNavTab>("buat-tiket");
  const [selectedAttraction, setSelectedAttraction] =
    useState<WorkerQrAttractionId>("sqp-express");

  // Form state matching Figma 193:2988 & 193:3050
  const [receiptMode, setReceiptMode] = useState<WorkerReceiptMode>("pos");
  const [posReceiptNumber, setPosReceiptNumber] = useState("SQP-6584");
  const [selectedBundling, setSelectedBundling] = useState(
    BUNDLING_OPTIONS[0].label
  );
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(2);

  // Worker QR database list & active QR view
  const [issuedQrs, setIssuedQrs] = useState<WorkerQrTicketRecord[]>([]);
  const [activeQr, setActiveQr] = useState<WorkerQrTicketRecord | null>(null);
  const [isLoadingQrs, setIsLoadingQrs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Print QR modal (Figma 193:4931 / 193:5277)
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Reachable LAN origin encoded into generated QR URLs for mobile camera scans
  const [targetLanOrigin, setTargetLanOrigin] = useState(
    `http://${DEFAULT_LAN_HOST}:3000`
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { protocol, hostname, port, origin } = window.location;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          setTargetLanOrigin(
            `${protocol}//${DEFAULT_LAN_HOST}${port ? `:${port}` : ":3000"}`
          );
        } else if (origin) {
          setTargetLanOrigin(origin);
        }
      } catch {
        // Keep default LAN origin
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const fetchIssuedQrs = useCallback(async () => {
    try {
      const res = await fetch("/api/db/worker-qr", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { qrs?: WorkerQrTicketRecord[] };
      if (data.qrs) {
        setIssuedQrs(data.qrs);
        setActiveQr((prev) =>
          prev ? data.qrs!.find((q) => q.id === prev.id) || prev : null
        );
      }
    } finally {
      setIsLoadingQrs(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuedQrs();
    const interval = setInterval(fetchIssuedQrs, 4000);
    return () => clearInterval(interval);
  }, [fetchIssuedQrs]);

  const handleSelectAttraction = (attrId: WorkerQrAttractionId) => {
    setSelectedAttraction(attrId);
    setActiveQr(null);
    setFormError(null);
    if (attrId === "sqp-express") {
      setPosReceiptNumber("SQP-6590");
      setAdultCount(2);
      setChildCount(2);
    } else {
      setPosReceiptNumber("4825");
      setAdultCount(2);
      setChildCount(0);
    }
  };

  const handleSelectTab = (tab: WorkerNavTab) => {
    setActiveTab(tab);
    if (tab === "buat-tiket") {
      setActiveQr(null);
    }
  };

  const handleGenerateSampleReceipt = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setReceiptMode("pos");
    setPosReceiptNumber(
      selectedAttraction === "sqp-express" ? `SQP-${rand}` : `${rand}`
    );
    setFormError(null);
  };

  const handleBundlingChange = (label: string) => {
    setSelectedBundling(label);
    const preset = BUNDLING_OPTIONS.find((b) => b.label === label);
    if (preset) {
      setAdultCount(preset.adults);
      setChildCount(preset.children);
    }
  };

  const handleCreateQrTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const { workerName } = getWorkerAttractionMeta(selectedAttraction);
      const res = await fetch("/api/db/worker-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posReceiptNumber: receiptMode === "pos" ? posReceiptNumber : "",
          bundlingName:
            receiptMode === "bundling" ? selectedBundling : undefined,
          attractionId: selectedAttraction,
          adultCount,
          childCount,
          issuedByWorker: workerName,
          targetOrigin: targetLanOrigin,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        qr?: WorkerQrTicketRecord;
        qrs?: WorkerQrTicketRecord[];
      };

      if (!res.ok || !data.qr) {
        setFormError(data.error || "Gagal membuat QR tiket.");
        return;
      }

      setActiveQr(data.qr);
      if (data.qrs) setIssuedQrs(data.qrs);
      showToast(`QR Klaim ${data.qr.claimCode} berhasil diterbitkan!`);
    } catch {
      setFormError("Terjadi kesalahan koneksi ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQrPng = async (qr: WorkerQrTicketRecord) => {
    const dataUrl = await renderQrTicketCardPngDataUrl(qr, targetLanOrigin);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${qr.claimCode}.png`;
    link.click();
    showToast(`QR card ${qr.claimCode}.png downloaded!`);
  };

  const handleCopyText = (text: string, toastMessage: string) => {
    navigator.clipboard?.writeText(text);
    showToast(toastMessage);
  };

  const meta = getWorkerAttractionMeta(selectedAttraction);
  const availableCount = issuedQrs.filter((q) => q.status === "AVAILABLE").length;
  const claimedCount = issuedQrs.filter((q) => q.status === "CLAIMED").length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9F6] text-[#183F2A]">
      <WorkerSidebar
        activeTab={activeTab}
        selectedAttraction={selectedAttraction}
        issuedQrCount={issuedQrs.length}
        attractionLabel={meta.attractionLabel}
        workerName={meta.workerName}
        avatarSrc={meta.avatarSrc}
        onSelectAttraction={handleSelectAttraction}
        onSelectTab={handleSelectTab}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkerTopBar
          activeTab={activeTab}
          activeQr={activeQr}
          attractionLabel={meta.attractionLabel}
          headerBadgeLabel={meta.headerBadgeLabel}
          onClearActiveQr={() => setActiveQr(null)}
        />

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#183F2A] text-white border-2 border-[#A8C943] px-4 py-3 rounded-2xl shadow-xl text-[13px] font-bold">
            {toast}
          </div>
        )}

        <main className="p-5 md:p-7 max-w-6xl w-full space-y-5">
          {activeTab === "beranda" && (
            <WorkerBerandaView
              availableCount={availableCount}
              claimedCount={claimedCount}
              onStartCreateQr={(attrId) => {
                handleSelectAttraction(attrId);
                setActiveTab("buat-tiket");
              }}
            />
          )}

          {activeTab === "buat-tiket" && !activeQr && (
            <WorkerCreateQrForm
              selectedAttraction={selectedAttraction}
              formAttractionTitle={meta.formAttractionTitle}
              issuedQrCount={issuedQrs.length}
              receiptMode={receiptMode}
              posReceiptNumber={posReceiptNumber}
              selectedBundling={selectedBundling}
              adultCount={adultCount}
              childCount={childCount}
              isSubmitting={isSubmitting}
              formError={formError}
              onChangeReceiptMode={setReceiptMode}
              onChangePosReceiptNumber={setPosReceiptNumber}
              onGenerateSampleReceipt={handleGenerateSampleReceipt}
              onChangeBundling={handleBundlingChange}
              onChangeAdultCount={setAdultCount}
              onChangeChildCount={setChildCount}
              onOpenDaftarQr={() => setActiveTab("daftar-qr")}
              onSubmit={handleCreateQrTicket}
            />
          )}

          {activeTab === "buat-tiket" && activeQr && (
            <WorkerQrResultView
              activeQr={activeQr}
              targetLanOrigin={targetLanOrigin}
              onChangeTargetLanOrigin={setTargetLanOrigin}
              onOpenPrintModal={() => setShowPrintModal(true)}
              onDownloadPng={handleDownloadQrPng}
              onCopyText={handleCopyText}
              onResetAndStartNew={() => {
                setActiveQr(null);
                handleGenerateSampleReceipt();
              }}
            />
          )}

          {activeTab === "daftar-qr" && (
            <WorkerQrListView
              issuedQrs={issuedQrs}
              isLoading={isLoadingQrs}
              onRefresh={fetchIssuedQrs}
              onSelectQr={(qr) => {
                setSelectedAttraction(qr.attractionId);
                setActiveQr(qr);
                setActiveTab("buat-tiket");
              }}
              onDownloadPng={handleDownloadQrPng}
            />
          )}
        </main>
      </div>

      {showPrintModal && activeQr && (
        <WorkerPrintQrModal
          qr={activeQr}
          targetLanOrigin={targetLanOrigin}
          onDownloadPng={handleDownloadQrPng}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
