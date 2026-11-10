"use client";

import React, { useEffect, useState } from "react";
import {
  ATTRACTIONS,
  AttractionId,
  INITIAL_HISTORY_TICKETS,
  INITIAL_TICKETS,
  SAMPLE_RECEIPT_PRESETS,
  SampleReceiptPreset,
  VisitorTicket,
} from "../data/visitorData";
import {
  BrowserVlmCapabilities,
  VlmReceiptScanResult,
  detectBrowserVlmCapabilities,
  downsampleReceiptImage,
  scanReceiptWithBrowserVlm,
} from "../utils/receiptVlmScanner";

type ActiveScreen =
  | "login"
  | "home"
  | "attraction-detail"
  | "ticket-queue"
  | "tickets"
  | "profile";

type AuthMode = "google" | "guest";

type ProfileSubView =
  | "main"
  | "account-data"
  | "edit-profile"
  | "change-password";

export type DeviceCategory = "mobile" | "tablet" | "desktop";

interface DeviceProfile {
  category: DeviceCategory;
  isTouch: boolean;
  width: number;
}

/**
 * Automatically detects whether the visitor is on a Mobile phone, Tablet, or Desktop
 * using viewport width, CSS pointer media queries (`pointer: coarse`), touch points, and User-Agent.
 */
function detectDeviceProfile(): DeviceProfile {
  if (typeof window === "undefined") {
    return { category: "mobile", isTouch: true, width: 390 };
  }

  const width = window.innerWidth;
  const coarsePointer =
    window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const hasTouchPoints =
    typeof navigator !== "undefined" && (navigator.maxTouchPoints ?? 0) > 0;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileUa = /Android.+Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua
  );
  const isTabletUa =
    /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(ua) ||
    ( coarsePointer && width >= 768 && width <= 1366 );

  const isTouch = coarsePointer || hasTouchPoints;

  let category: DeviceCategory = "desktop";
  if (width < 768 || isMobileUa) {
    category = "mobile";
  } else if (width < 1024 || isTabletUa) {
    category = "tablet";
  } else {
    category = "desktop";
  }

  return { category, isTouch, width };
}

export default function VisitorPortalApp() {
  // Automatic Device Profile (Mobile / Tablet / Desktop)
  const [device, setDevice] = useState<DeviceProfile>({
    category: "mobile",
    isTouch: true,
    width: 390,
  });

  useEffect(() => {
    const updateDevice = () => setDevice(detectDeviceProfile());
    updateDevice();
    window.addEventListener("resize", updateDevice);
    window.addEventListener("orientationchange", updateDevice);
    return () => {
      window.removeEventListener("resize", updateDevice);
      window.removeEventListener("orientationchange", updateDevice);
    };
  }, []);

  // Navigation & Auth State
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("google");
  const [showGoogleOAuthChooser, setShowGoogleOAuthChooser] = useState(false);

  // Attraction & Ticket Selection
  const [selectedAttractionId, setSelectedAttractionId] =
    useState<AttractionId>("sqp-express");
  const [selectedTicketId, setSelectedTicketId] =
    useState<string>("tkt-sqp-express");
  const [ticketsTab, setTicketsTab] = useState<"my-tickets" | "my-history">(
    "my-tickets"
  );

  // Tickets & Receipt State
  const [activeReceiptId, setActiveReceiptId] =
    useState<string>("SQP261102103019");
  const [tickets, setTickets] = useState<VisitorTicket[]>(INITIAL_TICKETS);
  const [historyTickets, setHistoryTickets] = useState<VisitorTicket[]>(
    INITIAL_HISTORY_TICKETS
  );
  const [smartAlerts, setSmartAlerts] = useState<Record<AttractionId, boolean>>({
    "sqp-express": true,
    "wall-climbing": true,
    "adventure-ropes": true,
  });
  const [expandedDescription, setExpandedDescription] = useState<
    Record<AttractionId, boolean>
  >({
    "sqp-express": false,
    "wall-climbing": false,
    "adventure-ropes": false,
  });

  // Modals
  const [showUseTicketModal, setShowUseTicketModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] =
    useState(false);
  const [showReceiptScannerModal, setShowReceiptScannerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Receipt VLM Scanner State
  const [vlmCaps, setVlmCaps] = useState<BrowserVlmCapabilities>({
    hasWebGPU: true,
    hasWasm: true,
    recommendedModel: "HuggingFaceTB/SmolVLM-256M-Instruct + Tesseract WASM",
    ocrEngine: "Tesseract.js v6 WebAssembly + Perceptual Vision Matcher",
    quantization: "q4f16 (WebGPU) + WASM SIMD",
    estimatedSizeMb: 194,
    deviceBackend: "webgpu",
  });
  const [selectedPresetReceipt, setSelectedPresetReceipt] =
    useState<SampleReceiptPreset>(SAMPLE_RECEIPT_PRESETS[0]);
  const [uploadedReceiptPreview, setUploadedReceiptPreview] = useState<{
    name: string;
    dataUrl: string;
    width: number;
    height: number;
    signature: number[];
  } | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [vlmStepText, setVlmStepText] = useState<string>("");
  const [lastScanResult, setLastScanResult] =
    useState<VlmReceiptScanResult | null>(null);

  useEffect(() => {
    setVlmCaps(detectBrowserVlmCapabilities());
  }, []);

  // User Profile State (Google user vs Guest — Guest never shows a Guest ID)
  const [profileSubView, setProfileSubView] = useState<ProfileSubView>("main");
  const [userProfile, setUserProfile] = useState({
    username: "Kevcak",
    fullName: "Kevin Cakrun",
    email: "kevinCakrun@gmail.com",
    phone: "+62 812-8890-4512",
  });
  const [editProfileDraft, setEditProfileDraft] = useState(userProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Display name used on tickets (Guest mode uses "Guest" without any ID)
  const holderDisplayName =
    authMode === "guest" ? "Guest" : userProfile.username || "James";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  const currentAttraction = ATTRACTIONS[selectedAttractionId];
  const currentTicket =
    tickets.find((t) => t.id === selectedTicketId) ||
    tickets[0] ||
    historyTickets[0];

  const isMultiColumnLayout =
    device.category === "desktop" || device.category === "tablet";

  // Navigation Helpers
  const openAttractionDetail = (attractionId: AttractionId) => {
    setSelectedAttractionId(attractionId);
    setActiveScreen("attraction-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTicketQueueView = (ticketId: string) => {
    const found = tickets.find((t) => t.id === ticketId);
    if (found) {
      setSelectedTicketId(found.id);
      setSelectedAttractionId(found.attractionId);
    }
    setActiveScreen("ticket-queue");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTicketForAttraction = (attractionId: AttractionId) => {
    const found = tickets.find((t) => t.attractionId === attractionId);
    if (found) {
      setSelectedTicketId(found.id);
      setSelectedAttractionId(attractionId);
      setActiveScreen("ticket-queue");
    } else {
      const attr = ATTRACTIONS[attractionId];
      const newTkt: VisitorTicket = {
        id: `tkt-${attractionId}-${Date.now()}`,
        receiptId: activeReceiptId,
        attractionId,
        attractionName: attr.name,
        cardThumbImage: attr.cardImage,
        myTicketsIllustration: attr.ticketIllustration,
        myTicketsBg: attr.ticketCardBg,
        guestSummaryHome: "1 Person",
        guestSummaryMyTickets: "1 Ticket • 1 Guest",
        holderName: holderDisplayName,
        membersLabel: "1 Member",
        validDateLine1: "valid on 31 oct 2026",
        validDateLine2: "08.00 - 18.00",
        includes: [
          "1 guest admission",
          "Standard attraction access",
          "Valid on Selected Date",
        ],
        queueStatus: "not_joined",
        queuePosition: "A2N14",
        queueNodes: ["A2N10", "A2N11", "A2N12", "A2N13", "YOU"],
        estimatedBoardingTime: "16:45",
        joinedQueueAt: "15.30",
      };
      setTickets((prev) => [newTkt, ...prev]);
      setSelectedTicketId(newTkt.id);
      setSelectedAttractionId(attractionId);
      setActiveScreen("ticket-queue");
      triggerToast(`Claimed ticket for ${attr.name}!`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJoinQueue = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              queueStatus: "in_queue",
              joinedQueueAt: "15.00",
            }
          : t
      )
    );
    const tkt = tickets.find((t) => t.id === ticketId);
    triggerToast(
      `Joined virtual queue for ${tkt?.attractionName ?? "Attraction"}! Position: ${
        tkt?.queuePosition ?? "B2N10"
      }`
    );
  };

  const handleToggleQueueStateForDemo = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              queueStatus:
                t.queueStatus === "in_queue" ? "not_joined" : "in_queue",
            }
          : t
      )
    );
  };

  const handleConfirmUseTicket = () => {
    if (!currentTicket) return;
    setShowUseTicketModal(false);

    const usedTicket: VisitorTicket = {
      ...currentTicket,
      id: `hist-${currentTicket.id}-${Date.now()}`,
      queueStatus: "used",
      usedDateText: "25 Oct 2026",
    };

    setHistoryTickets((prev) => [usedTicket, ...prev]);
    setTickets((prev) => prev.filter((t) => t.id !== currentTicket.id));
    setTicketsTab("my-history");
    setActiveScreen("tickets");
    triggerToast(
      `Ticket for ${currentTicket.attractionName} marked as Used!`
    );
  };

  // Auth Handlers
  const handleSignInWithGoogleAccount = (account: {
    username: string;
    fullName: string;
    email: string;
  }) => {
    setAuthMode("google");
    setUserProfile((prev) => ({
      ...prev,
      username: account.username,
      fullName: account.fullName,
      email: account.email,
    }));
    setShowGoogleOAuthChooser(false);
    setActiveScreen("home");
    triggerToast(`Signed in with Google as ${account.fullName}`);
  };

  const handleContinueAsGuest = () => {
    setAuthMode("guest");
    setShowGoogleOAuthChooser(false);
    setActiveScreen("home");
    triggerToast("Continuing as Guest");
  };

  // Receipt VLM Scan Handlers
  const handleReceiptFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scaled = await downsampleReceiptImage(file, 1024);
      const uploadedObj = {
        name: file.name,
        dataUrl: scaled.dataUrl,
        width: scaled.width,
        height: scaled.height,
        signature: scaled.signature,
      };
      setUploadedReceiptPreview(uploadedObj);
      setIsScanningReceipt(true);
      setLastScanResult(null);
      const result = await scanReceiptWithBrowserVlm({
        uploadedImage: uploadedObj,
        holderDisplayName: authMode === "guest" ? "Guest" : "James",
        onStep: (step) => setVlmStepText(step),
      });
      setLastScanResult(result);
    } catch {
      triggerToast("Could not read receipt image file.");
    } finally {
      setIsScanningReceipt(false);
      setVlmStepText("");
    }
  };

  const handleRunVlmReceiptScan = async () => {
    setIsScanningReceipt(true);
    setLastScanResult(null);
    try {
      const result = await scanReceiptWithBrowserVlm({
        preset: uploadedReceiptPreview ? undefined : selectedPresetReceipt,
        uploadedImage: uploadedReceiptPreview || undefined,
        holderDisplayName: authMode === "guest" ? "Guest" : "James",
        onStep: (step) => setVlmStepText(step),
      });
      setLastScanResult(result);
    } finally {
      setIsScanningReceipt(false);
      setVlmStepText("");
    }
  };

  const handleApplyScannedReceiptTickets = () => {
    if (!lastScanResult) return;
    setActiveReceiptId(lastScanResult.receiptId);
    setTickets(lastScanResult.tickets);
    if (lastScanResult.tickets[0]) {
      setSelectedTicketId(lastScanResult.tickets[0].id);
      setSelectedAttractionId(lastScanResult.tickets[0].attractionId);
    }
    setShowReceiptScannerModal(false);
    setTicketsTab("my-tickets");
    setActiveScreen("tickets");
    triggerToast(
      `Loaded ${lastScanResult.tickets.length} tickets from Receipt ${lastScanResult.receiptId}!`
    );
  };

  const bottomNavTab: "home" | "tickets" | "profile" =
    activeScreen === "tickets"
      ? "tickets"
      : activeScreen === "profile"
      ? "profile"
      : "home";

  // ============================================================================
  // 0. LOGIN / WELCOME PREVIEW SCREEN (Google OAuth Preview + Guest without ID)
  // ============================================================================
  const renderLoginScreen = () => (
    <div className="w-full pb-28 max-w-md mx-auto">
      <div className="relative w-full overflow-hidden md:rounded-[32px] bg-[#FFF4DC] md:shadow-[0_12px_36px_rgba(38,59,41,0.16)] md:border md:border-[#E8EFD9] md:mt-4">
        {/* Top Park Photo */}
        <div className="relative h-[300px] w-full overflow-hidden">
          <img
            src="/assets/visitor/hero-bg.png"
            alt="Scientia Square Park"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-transparent" />
          <div className="absolute top-8 left-6 right-6 text-white">
            <span className="inline-block bg-[#4D8B45]/90 backdrop-blur-xs text-[#FFF4DC] font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
              Scientia Square Park
            </span>
            <h1 className="font-extrabold text-[28px] leading-tight mt-2 drop-shadow-md">
              Let&apos;s Explore SQP!
            </h1>
            <p className="text-[14px] text-white/95 font-medium mt-0.5 drop-shadow">
              Virtual Queue &amp; Digital Attraction Passes
            </p>
          </div>

          {/* Convex Cream Arch at Bottom of Hero Image */}
          <div className="absolute -bottom-8 left-[-12%] right-[-12%] h-16 bg-[#FFF4DC] rounded-t-[50%]" />
        </div>

        {/* Login Sheet Body */}
        <div className="relative px-7 pt-2 pb-9 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#4D8B45] text-[#F2C94C] font-extrabold text-[20px] flex items-center justify-center mx-auto shadow-md">
            SQP
          </div>

          <h2 className="font-extrabold text-[26px] text-[#263B29] mt-3">
            Welcome!
          </h2>
          <p className="text-[14px] text-[#6B665C] mt-1 max-w-[260px] mx-auto leading-snug">
            Sign in to manage your virtual queue and attraction tickets, or
            continue directly as a guest.
          </p>

          {/* Primary Action 1: Continue with Google (OAuth Preview) */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setShowGoogleOAuthChooser(true)}
              className="w-full h-[54px] bg-white hover:bg-[#F8FAF6] active:scale-[0.99] border-2 border-[#D8E7D2] rounded-[18px] px-4 flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <div className="text-left">
                <p className="font-bold text-[14px] text-[#263B29] leading-tight">
                  Continue with Google
                </p>
                <p className="text-[11px] text-[#6B665C]">
                  Sync tickets &amp; queue alerts across devices
                </p>
              </div>
            </button>

            {/* Primary Action 2: Continue as Guest (No Guest ID shown) */}
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full h-[54px] bg-[#4D8B45] hover:bg-[#3d7236] active:scale-[0.99] text-white rounded-[18px] px-4 flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-[#F2C94C] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div className="text-left">
                <p className="font-bold text-[15px] text-white leading-tight">
                  Continue as Guest
                </p>
                <p className="text-[11px] text-[#E8EFD9]">
                  Instant park access • Scan receipt to load tickets
                </p>
              </div>
            </button>
          </div>

          {/* Scan Receipt Shortcut on Login */}
          <div className="mt-5 pt-4 border-t border-[#E8EFD9]">
            <button
              type="button"
              onClick={() => setShowReceiptScannerModal(true)}
              className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4D8B45] hover:underline cursor-pointer"
            >
              <span>Have a printed park receipt? Scan Receipt with AI</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // 1. HOME SCREEN (Exact Figma Node 28:3584 / steps/123/media_0.png)
  // ============================================================================
  const renderHomeScreen = () => (
    <div className="w-full pb-28">
      {/* Hero Banner with Top-Left Text & Bottom Convex Cream Curve */}
      <div className="relative w-full overflow-hidden lg:rounded-t-[32px] lg:mt-4">
        <div
          className={`relative w-full ${
            isMultiColumnLayout ? "h-[300px] md:h-[340px]" : "h-[268px]"
          }`}
        >
          <img
            src="/assets/visitor/hero-bg.png"
            alt="Scientia Square Park"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/15" />

          {/* Exact Top-Left Hero Text Placement (matches steps/123/media_0.png) */}
          <div className="absolute top-8 left-6 md:top-10 md:left-8 right-6 text-white z-10">
            <h1 className="font-extrabold text-[28px] md:text-[36px] leading-[1.12] tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
              Let&apos;s Explore SQP!
            </h1>
            <p className="font-medium text-[16px] md:text-[18px] text-white/95 leading-[1.28] mt-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              Discover fun, nature,
              <br />
              and adventure
            </p>
          </div>

          {/* Smooth Convex Cream Arch at Bottom of Hero Image (matches steps/123/media_0.png) */}
          <div className="absolute -bottom-7 left-[-10%] right-[-10%] h-14 bg-[#FFF4DC] rounded-t-[50%] z-10" />
        </div>
      </div>

      {/* Live Wait Time Strip (Exact Figma layout: top-left icon, title, bottom #E8EFD9 pill) */}
      <section className="relative z-20 -mt-1 px-5 lg:px-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-[15px] md:text-[16px] text-[#1E1E1E]">
            Live Wait Time Strip
          </h2>
          <button
            type="button"
            onClick={() => setShowReceiptScannerModal(true)}
            className="inline-flex items-center gap-1.5 bg-[#E8EFD9] hover:bg-[#dce7c6] text-[#4D8B45] font-bold text-[11px] px-3 py-1 rounded-full transition-colors cursor-pointer"
          >
            <span>📷 Scan Receipt</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 md:gap-4">
          {(
            [
              {
                id: "sqp-express" as AttractionId,
                iconType: "train",
              },
              {
                id: "wall-climbing" as AttractionId,
                iconType: "climber",
              },
              {
                id: "adventure-ropes" as AttractionId,
                iconType: "ropes",
              },
            ] as const
          ).map((item) => {
            const attr = ATTRACTIONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openAttractionDetail(item.id)}
                className="bg-[#F2C94C] hover:bg-[#eab92d] active:scale-[0.99] transition-all rounded-[14px] p-2.5 md:p-3.5 flex flex-col justify-between text-left cursor-pointer shadow-xs"
              >
                {/* Top-left Green Icon */}
                <div className="w-5 h-5 text-[#4D8B45] flex items-center justify-center mb-1">
                  {item.iconType === "train" && (
                    <img
                      src="/assets/visitor/icon-train.svg"
                      alt=""
                      className="w-[18px] h-[18px] object-contain"
                    />
                  )}
                  {item.iconType === "climber" && (
                    <svg
                      className="w-[18px] h-[18px] text-[#4D8B45]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                    </svg>
                  )}
                  {item.iconType === "ropes" && (
                    <svg
                      className="w-[18px] h-[18px] text-[#4D8B45]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6v12M20 6v12M4 9h16M4 15h16M8 9v6M12 9v6M16 9v6"
                      />
                    </svg>
                  )}
                </div>

                {/* Middle Bold Attraction Name */}
                <p className="font-bold text-[12px] md:text-[14px] text-[#263B29] leading-tight truncate">
                  {attr.name}
                </p>

                {/* Bottom Soft Sage Pill: "10 min wait • operational" */}
                <div className="mt-1.5 bg-[#E8EFD9] rounded-full px-2 py-0.5 w-full text-center">
                  <p className="text-[9px] md:text-[11px] font-semibold text-[#263B29] truncate">
                    {attr.stripWaitLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Layout: Automatically 1-column on Mobile, 2-column on Tablet/Desktop */}
      <div
        className={`mt-6 px-5 lg:px-0 ${
          isMultiColumnLayout
            ? "grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            : "space-y-6"
        }`}
      >
        {/* Left / Top Column: Your Ticket Section */}
        <section className={isMultiColumnLayout ? "md:col-span-5" : ""}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[16px] md:text-[18px] text-[#1E1E1E]">
              Your Ticket
            </h2>
            <button
              type="button"
              onClick={() => {
                setTicketsTab("my-tickets");
                setActiveScreen("tickets");
              }}
              className="text-[12px] font-bold text-[#4D8B45] hover:underline cursor-pointer"
            >
              See All ({tickets.length})
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-[#E8EFD9] rounded-[18px] p-5 text-center">
              <p className="font-bold text-[15px] text-[#263B29]">
                No active tickets
              </p>
              <p className="text-[12px] text-[#6B665C] mt-1">
                Scan your park receipt or claim a ticket below.
              </p>
              <button
                type="button"
                onClick={() => setShowReceiptScannerModal(true)}
                className="mt-3 bg-[#4D8B45] text-white font-bold text-[12px] px-4 py-2 rounded-full cursor-pointer"
              >
                Scan Receipt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {tickets.slice(0, 2).map((tkt) => (
                <div
                  key={tkt.id}
                  onClick={() => openTicketQueueView(tkt.id)}
                  className="group relative bg-[#E8EFD9] rounded-t-[16px] pb-5 overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-[148px] md:h-[164px] w-full rounded-[15px] overflow-hidden">
                      <img
                        src={tkt.cardThumbImage}
                        alt={tkt.attractionName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {tkt.queueStatus === "in_queue" && (
                        <span className="absolute top-2 right-2 bg-[#F2C94C] text-[#263B29] font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                          {tkt.queuePosition}
                        </span>
                      )}
                    </div>

                    <div className="px-3 pt-2.5">
                      <h3 className="font-bold text-[15px] text-[#263B29] leading-tight truncate">
                        {tkt.attractionName}
                      </h3>
                      <p className="text-[12px] text-[#6B665C] mt-0.5">
                        {tkt.guestSummaryHome}
                      </p>
                    </div>
                  </div>

                  {/* Left-Aligned Green Pill Button ("View Ticket") */}
                  <div className="px-3 mt-3">
                    <span className="inline-flex items-center justify-center bg-[#4D8B45] group-hover:bg-[#3d7236] text-white font-semibold text-[11px] px-4 py-1.5 rounded-full transition-colors">
                      View Ticket
                    </span>
                  </div>

                  {/* Scalloped Perforated Bottom Edge (Cream Semicircles) */}
                  <div className="absolute -bottom-2 left-0 right-0 flex justify-around px-1 pointer-events-none">
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full bg-[#FFF4DC]"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right / Bottom Column: Explore Attractions */}
        <section className={isMultiColumnLayout ? "md:col-span-7" : ""}>
          <h2 className="font-bold text-[16px] md:text-[18px] text-[#1E1E1E] mb-3">
            Explore Attractions
          </h2>

          <div className="space-y-4">
            {(
              [
                "sqp-express",
                "adventure-ropes",
                "wall-climbing",
              ] as AttractionId[]
            ).map((attrId) => {
              const attr = ATTRACTIONS[attrId];
              return (
                <div
                  key={attr.id}
                  onClick={() => openAttractionDetail(attr.id)}
                  className="group relative h-[200px] md:h-[225px] w-full rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer bg-[#E8EFD9]"
                >
                  <img
                    src={attr.cardImage}
                    alt={attr.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />

                  {/* Overlaid White Rounded Info Card at Bottom */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white rounded-[16px] px-4 py-3 shadow-xs flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[15px] md:text-[16px] text-[#263B29] leading-tight truncate">
                        {attr.name}
                      </h3>
                      <div className="mt-1 space-y-0.5 text-[11.5px] text-[#6B665C]">
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/assets/visitor/icon-clock.svg"
                            alt=""
                            className="w-3.5 h-3.5 shrink-0"
                          />
                          <span className="truncate">{attr.shortHours}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/assets/visitor/icon-price-tag.svg"
                            alt=""
                            className="w-3.5 h-3.5 shrink-0"
                          />
                          <span className="font-medium text-[#6B665C]">
                            {attr.shortPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAttractionDetail(attr.id);
                      }}
                      className="bg-[#4D8B45] hover:bg-[#3b6e34] text-white font-semibold text-[12px] px-4 py-2 rounded-full shrink-0 transition-colors cursor-pointer"
                    >
                      View detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );

  // ============================================================================
  // 2. ATTRACTION DETAIL SCREEN (Exact Figma Nodes 93:32996, 443:6687, 453:6801)
  // ============================================================================
  const renderAttractionDetailScreen = () => {
    const attr = currentAttraction;
    const isExpanded = expandedDescription[attr.id];
    const alertEnabled = smartAlerts[attr.id];

    return (
      <div className="w-full pb-28">
        {/* Top Hero Image + Back Button */}
        <div className="relative w-full h-[250px] md:h-[300px] lg:rounded-t-[28px] overflow-hidden">
          <img
            src={attr.heroImage}
            alt={attr.name}
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={() => setActiveScreen("home")}
            aria-label="Back to Home"
            className="absolute top-5 left-5 w-[46px] h-[46px] flex items-center justify-center rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer z-20"
          >
            <img
              src="/assets/visitor/back-circle.svg"
              alt=""
              className="absolute inset-0 w-full h-full"
            />
            <img
              src="/assets/visitor/back-arrow.svg"
              alt=""
              className="relative w-[14px] h-[21px] -ml-0.5"
            />
          </button>
        </div>

        {/* Overlapping Fresh Lime (#A8C943) Rounded Top Banner */}
        <div className="relative z-10 -mt-6 w-full bg-[#A8C943] rounded-t-[28px] pt-2.5 pb-7 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#263B29] font-bold text-[15px]">
            <span>{attr.waitMinutes} min wait</span>
            <span className="h-4 w-[1.5px] bg-[#263B29]/60" />
            <span>{attr.inQueueCount} in queue</span>
          </div>
        </div>

        {/* Overlapping Warm Cream (#FFF4DC) Main Sheet */}
        <div className="relative z-20 -mt-4 bg-[#FFF4DC] rounded-t-[28px] px-5 lg:px-8 pt-5">
          {/* Header Row: Avatar + Title & Category Pill + Operational Pill */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <img
                src={attr.avatarImage}
                alt={attr.name}
                className="w-[56px] h-[56px] rounded-full object-cover shrink-0 shadow-xs"
              />
              <div>
                <h1 className="font-bold text-[20px] md:text-[24px] text-[#263B29] leading-tight">
                  {attr.name}
                </h1>
                <span className="inline-block mt-1 bg-[#E8EFD9] text-[#263B29] font-semibold text-[11.5px] px-3 py-1 rounded-full">
                  {attr.category}
                </span>
              </div>
            </div>

            <span className="mt-1 bg-[#E8EFD9] text-[#4D8B45] font-semibold text-[12px] px-3 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#4D8B45]" />
              {attr.status}
            </span>
          </div>

          {/* Description Section */}
          <div className="mt-4">
            <h2 className="font-bold text-[16px] text-[#263B29] mb-1">
              Description
            </h2>
            <p className="text-[13px] text-[#6B665C] leading-relaxed">
              {attr.id === "sqp-express" && !isExpanded ? (
                <>
                  Nikmati petualangan seru bersama keluarga dengan SQP Express!
                  Kereta mini klasik ini siap mengajak kamu berkeliling{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDescription((prev) => ({
                        ...prev,
                        [attr.id]: true,
                      }))
                    }
                    className="text-[#F28C28] font-semibold hover:underline cursor-pointer"
                  >
                    read more...
                  </button>
                </>
              ) : (
                <>
                  {attr.description}{" "}
                  {attr.id === "sqp-express" && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDescription((prev) => ({
                          ...prev,
                          [attr.id]: false,
                        }))
                      }
                      className="text-[#F28C28] font-semibold hover:underline cursor-pointer"
                    >
                      show less
                    </button>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Smart Alerts Card (#E8EFD9) */}
          <div className="mt-4 bg-[#E8EFD9] rounded-[18px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/visitor/icon-bell.svg"
                alt=""
                className="w-[23px] h-[27px] shrink-0"
              />
              <div>
                <h3 className="font-bold text-[14px] text-[#263B29]">
                  Smart Alerts
                </h3>
                <p className="text-[11.5px] text-[#6B665C]">
                  Notify me when under 20 min
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={alertEnabled}
              onClick={() => {
                const nextVal = !alertEnabled;
                setSmartAlerts((prev) => ({ ...prev, [attr.id]: nextVal }));
                triggerToast(
                  nextVal
                    ? `Smart Alerts enabled for ${attr.name}`
                    : `Smart Alerts turned off for ${attr.name}`
                );
              }}
              className={`w-[58px] h-[30px] rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                alertEnabled ? "bg-[#558B2F]" : "bg-[#6B665C]/40"
              }`}
            >
              <span
                className={`w-[22px] h-[22px] rounded-full bg-white shadow-xs transition-transform ${
                  alertEnabled ? "translate-x-[28px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Requirements & Safety / Hours / Price */}
          <div
            className={`mt-4 ${
              isMultiColumnLayout
                ? "grid grid-cols-1 md:grid-cols-2 gap-5 items-start"
                : "space-y-4"
            }`}
          >
            <div>
              <h2 className="font-bold text-[16px] text-[#263B29] mb-2">
                Requirements
              </h2>
              <div className="bg-[#E8EFD9] rounded-[18px] px-4 py-1 divide-y divide-[#263B29]/10">
                {attr.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-start gap-3 text-[12.5px]"
                  >
                    <div
                      className={`flex items-center gap-2.5 shrink-0 ${
                        req.value || req.bullets ? "w-[130px]" : "flex-1"
                      }`}
                    >
                      <img
                        src={req.icon}
                        alt=""
                        className="w-[20px] h-[20px] object-contain shrink-0"
                      />
                      <span className="font-bold text-[#263B29]">
                        {req.label}{" "}
                        {!req.bullets &&
                          attr.id === "wall-climbing" &&
                          req.value && (
                            <span className="font-normal text-[#6B665C]">
                              {req.value}
                            </span>
                          )}
                      </span>
                    </div>

                    {req.value && attr.id !== "wall-climbing" && (
                      <div className="flex-1 text-[#6B665C] leading-snug">
                        {req.value}
                      </div>
                    )}

                    {req.bullets && (
                      <ul className="flex-1 list-disc list-inside text-[#263B29] space-y-0.5 leading-snug">
                        {req.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Safety Information Section */}
              {attr.safetyBullets.length > 0 && (
                <div>
                  {attr.showSafetyHeading && (
                    <h2 className="font-bold text-[16px] text-[#263B29] mb-2">
                      Safety Information
                    </h2>
                  )}
                  <div className="bg-[#E8EFD9] rounded-[18px] p-4 flex items-center gap-3.5">
                    <img
                      src={attr.safetyIcon}
                      alt=""
                      className="w-[24px] h-[24px] shrink-0"
                    />
                    {attr.safetyBullets.length === 1 ? (
                      <p className="text-[12.5px] text-[#263B29] leading-snug">
                        {attr.safetyBullets[0]}
                      </p>
                    ) : (
                      <ul className="list-disc list-inside text-[12.5px] text-[#263B29] space-y-1 leading-snug">
                        {attr.safetyBullets.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Operating Hours Horizontal Card */}
              <div className="bg-[#E8EFD9] rounded-[18px] px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                  <img
                    src="/assets/visitor/icon-calendar.svg"
                    alt=""
                    className="w-[24px] h-[24px]"
                  />
                  <span className="font-bold text-[14px] text-[#263B29]">
                    Operating Hours
                  </span>
                </div>
                <div className="text-[11.5px] text-[#263B29] text-left space-y-0.5">
                  {attr.operatingHours.map((oh, idx) => (
                    <p key={idx}>
                      <span className="font-bold">{oh.label}</span> {oh.value}
                    </p>
                  ))}
                </div>
              </div>

              {/* Price Horizontal Card */}
              <div className="bg-[#E8EFD9] rounded-[18px] px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                  <img
                    src="/assets/visitor/icon-price-tag.svg"
                    alt=""
                    className="w-[25px] h-[25px]"
                  />
                  <span className="font-bold text-[14px] text-[#263B29]">
                    Price
                  </span>
                </div>

                {attr.priceSummary ? (
                  <div className="flex-1 text-center">
                    <span className="font-bold text-[16px] text-[#263B29]">
                      {attr.priceSummary}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11.5px] text-[#263B29] space-y-1.5">
                    {attr.priceTiers?.map((tier, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold w-[76px] shrink-0">
                          {tier.name}
                        </span>
                        <div>
                          {tier.items.map((it, i) => (
                            <p key={i}>{it}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Pill CTA Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openTicketForAttraction(attr.id)}
              className="w-full max-w-[290px] h-[48px] bg-[#4D8B45] hover:bg-[#3d7236] active:scale-[0.99] text-white font-bold text-[16px] rounded-full shadow-md transition-all cursor-pointer"
            >
              {attr.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 3. TICKET & VIRTUAL QUEUE SCREEN (Exact Figma Nodes 38:2105 & 435:3469)
  // ============================================================================
  const renderTicketQueueScreen = () => {
    const tkt = currentTicket;
    const attr = ATTRACTIONS[tkt.attractionId];
    const isInQueue = tkt.queueStatus === "in_queue";

    return (
      <div className="w-full pb-28">
        {/* Top Hero Image + Back Button */}
        <div className="relative w-full h-[195px] md:h-[235px] lg:rounded-t-[28px] overflow-hidden">
          <img
            src={attr.heroImage}
            alt={attr.name}
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={() => setActiveScreen("tickets")}
            aria-label="Back"
            className="absolute top-5 left-5 w-[46px] h-[46px] flex items-center justify-center rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer z-20"
          >
            <img
              src="/assets/visitor/back-circle.svg"
              alt=""
              className="absolute inset-0 w-full h-full"
            />
            <img
              src="/assets/visitor/back-arrow.svg"
              alt=""
              className="relative w-[14px] h-[21px] -ml-0.5"
            />
          </button>

          {/* Interactive State Toggle (Pre-Queue vs Active Queue) */}
          <div className="absolute top-5 right-5 flex items-center gap-1 bg-[#FFF4DC]/95 backdrop-blur-xs p-1 rounded-full shadow-md z-20">
            <button
              type="button"
              onClick={() => {
                if (isInQueue) handleToggleQueueStateForDemo(tkt.id);
              }}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                !isInQueue
                  ? "bg-[#4D8B45] text-white"
                  : "text-[#263B29] hover:bg-[#E8EFD9]"
              }`}
            >
              Join Queue View
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isInQueue) handleToggleQueueStateForDemo(tkt.id);
              }}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                isInQueue
                  ? "bg-[#4D8B45] text-white"
                  : "text-[#263B29] hover:bg-[#E8EFD9]"
              }`}
            >
              Active Queue ({tkt.queuePosition})
            </button>
          </div>
        </div>

        {/* Overlapping Warm Cream Sheet */}
        <div className="relative z-10 -mt-5 bg-[#FFF4DC] rounded-t-[28px] px-5 pt-5 max-w-[460px] mx-auto">
          {isInQueue && (
            <div className="mb-4 bg-[#E8EFD9] rounded-[18px] px-4 py-3 flex items-center justify-between gap-1">
              {tkt.queueNodes.map((node, index) => {
                const isYou = node === "YOU";
                return (
                  <React.Fragment key={node}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[10.5px] ${
                          isYou
                            ? "bg-[#F2C94C] text-[#263B29] ring-3 ring-[#4D8B45]/30"
                            : "bg-[#4D8B45] text-white"
                        }`}
                      >
                        {isYou ? "YOU" : index + 1}
                      </div>
                      <span className="mt-1 text-[10.5px] font-bold text-[#263B29]">
                        {node}
                      </span>
                    </div>
                    {index < tkt.queueNodes.length - 1 && (
                      <div className="flex-1 h-[2.5px] bg-[#4D8B45]/35 rounded-full -mt-3.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Perforated Green Ticket Card */}
          <div className="w-full max-w-[366px] mx-auto">
            {isInQueue && (
              <div className="bg-[#A8C943] rounded-t-[28px] pt-2.5 pb-6 text-center text-[#263B29] font-bold text-[13.5px] flex items-center justify-center gap-3">
                <span>{attr.waitMinutes} min wait</span>
                <span className="h-3.5 w-[1.5px] bg-[#263B29]/60" />
                <span>{attr.inQueueCount} in queue</span>
              </div>
            )}

            <div
              className={`relative bg-[#4D8B45] text-white rounded-[28px] ${
                isInQueue ? "-mt-3.5" : ""
              } shadow-[0_10px_24px_rgba(38,59,41,0.22)] overflow-hidden`}
            >
              <div className="px-7 pt-6 pb-5">
                {!isInQueue ? (
                  <div>
                    <div className="h-[46px] flex items-center justify-start mb-3">
                      <img
                        src={attr.ticketIllustration}
                        alt=""
                        className="h-full w-auto object-contain"
                      />
                    </div>

                    <h2 className="font-extrabold text-[26px] text-white uppercase tracking-wide leading-tight">
                      {tkt.attractionName}
                    </h2>

                    <p className="font-medium text-[15px] text-white mt-3">
                      Includes
                    </p>
                    <ul className="mt-1.5 list-disc list-inside text-[13.5px] text-white/85 space-y-1 font-normal">
                      {tkt.includes.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>

                    <div className="mt-5">
                      <p className="font-bold text-[20px] text-white leading-tight">
                        {tkt.holderName}
                      </p>
                      <div className="mt-1.5 grid grid-cols-2 gap-2 items-start italic text-[14px] text-white/95">
                        <span>{tkt.membersLabel}</span>
                        <div className="leading-snug">
                          <p>{tkt.validDateLine1}</p>
                          <p>{tkt.validDateLine2}</p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-center text-[#F2C94C] text-[13px] font-medium">
                      Redeem this ticket before boarding
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-center pt-1">
                      <p className="font-semibold text-[21px] text-white">
                        Your Position
                      </p>
                      <p className="font-extrabold text-[46px] text-[#F2C94C] leading-tight mt-1">
                        {tkt.queuePosition}
                      </p>
                    </div>

                    <div className="mt-4 text-left">
                      <p className="font-semibold text-[15px] text-white">
                        Estimated Boarding Time
                      </p>
                      <p className="font-extrabold text-[28px] text-[#F2C94C] leading-tight mt-0.5">
                        {tkt.estimatedBoardingTime}
                      </p>
                      <p className="text-[12.5px] text-white/85 mt-1">
                        Please arrive 10 minutes before boarding
                      </p>
                    </div>

                    <div className="mt-5 text-left">
                      <p className="font-bold text-[20px] text-white leading-tight">
                        {tkt.holderName}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2 italic text-[14px] text-white/95">
                        <span>{tkt.membersLabel}</span>
                        <span>You joined queue at {tkt.joinedQueueAt}</span>
                      </div>
                    </div>

                    <p className="mt-5 text-center text-[#F2C94C] text-[13px] font-medium">
                      Redeem this ticket before boarding
                    </p>
                  </div>
                )}
              </div>

              {/* Perforation Row */}
              <div className="relative flex items-center justify-between my-1">
                <span className="w-6 h-6 rounded-full bg-[#FFF4DC] -ml-3 shrink-0" />
                <div className="w-full border-t-2 border-dashed border-white/85 mx-1" />
                <span className="w-6 h-6 rounded-full bg-[#FFF4DC] -mr-3 shrink-0" />
              </div>

              {/* Lower Ticket Section */}
              <div className="px-7 pt-5 pb-7 flex flex-col items-center">
                {!isInQueue ? (
                  <button
                    type="button"
                    onClick={() => handleJoinQueue(tkt.id)}
                    className="w-full max-w-[260px] h-[68px] bg-[#F2C94C] hover:bg-[#e5ba38] active:scale-[0.98] text-[#263B29] font-extrabold text-[28px] rounded-[22px] shadow-sm transition-all cursor-pointer"
                  >
                    Join Queue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUseTicketModal(true)}
                    className="w-full max-w-[260px] h-[68px] bg-[#F2C94C] hover:bg-[#e5ba38] active:scale-[0.98] text-[#263B29] font-extrabold text-[28px] rounded-[22px] shadow-sm transition-all cursor-pointer"
                  >
                    Use Ticket
                  </button>
                )}

                <span className="mt-2.5 text-[11px] text-[#E8EFD9]/80 font-medium">
                  Receipt ID: {tkt.receiptId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 4. MY TICKETS & MY HISTORY SCREEN (Exact Figma Nodes 392:103086 & 424:528)
  // ============================================================================
  const renderTicketsAndHistoryScreen = () => {
    const isMyTickets = ticketsTab === "my-tickets";

    return (
      <div className="w-full px-5 lg:px-8 pt-6 pb-28 max-w-xl mx-auto">
        <div className="mx-auto w-full max-w-[270px] h-[48px] bg-[#E4E7E2] rounded-full p-1 flex items-center">
          <button
            type="button"
            onClick={() => setTicketsTab("my-tickets")}
            className={`flex-1 h-full rounded-full font-semibold text-[14.5px] transition-all cursor-pointer ${
              isMyTickets
                ? "bg-[#4D8B45] text-white shadow-xs"
                : "text-[#263B29]"
            }`}
          >
            My Tickets
          </button>
          <button
            type="button"
            onClick={() => setTicketsTab("my-history")}
            className={`flex-1 h-full rounded-full font-semibold text-[14.5px] transition-all cursor-pointer ${
              !isMyTickets
                ? "bg-[#4D8B45] text-white shadow-xs"
                : "text-[#263B29]"
            }`}
          >
            My History
          </button>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <h1 className="font-extrabold text-[34px] leading-[1.08] text-[#111111] uppercase tracking-tight">
            MY
            <br />
            {isMyTickets ? "TICKETS" : "HISTORY"}
          </h1>

          <button
            type="button"
            onClick={() => setShowReceiptScannerModal(true)}
            className="bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[12px] px-3.5 py-2 rounded-full shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📷 Scan Receipt</span>
          </button>
        </div>

        {isMyTickets ? (
          <div className="mt-5">
            {tickets.length === 0 ? (
              <div className="bg-[#E8EFD9] rounded-[26px] p-8 text-center">
                <p className="font-bold text-[17px] text-[#263B29]">
                  No active tickets
                </p>
                <p className="text-[13px] text-[#6B665C] mt-1">
                  Scan a receipt or explore attractions to add tickets.
                </p>
              </div>
            ) : (
              tickets.map((tkt, idx) => (
                <div
                  key={tkt.id}
                  style={{ backgroundColor: tkt.myTicketsBg }}
                  className={`relative rounded-[26px] px-5 py-5 flex items-center justify-between gap-3 border border-white/50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] ${
                    idx > 0 ? "-mt-4 pt-6" : ""
                  }`}
                >
                  <div className="z-10 flex-1 min-w-0">
                    <h2 className="font-extrabold text-[20px] text-[#263B29] leading-tight">
                      {tkt.attractionName}
                    </h2>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#6B665C] font-medium">
                      <svg
                        className="w-4 h-4 text-[#6B665C] shrink-0 -rotate-45"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      <span>{tkt.guestSummaryMyTickets}</span>
                    </div>

                    <p className="mt-1 text-[11px] font-bold text-[#4D8B45]">
                      Order #{tkt.receiptId}
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => openTicketQueueView(tkt.id)}
                        className="bg-[#4D8B45] hover:bg-[#3d7236] text-white font-semibold text-[13.5px] px-7 py-2 rounded-full shadow-xs transition-colors cursor-pointer"
                      >
                        View Ticket
                      </button>
                    </div>
                  </div>

                  <div className="w-[125px] h-[110px] shrink-0 flex items-center justify-end">
                    <img
                      src={tkt.myTicketsIllustration}
                      alt={tkt.attractionName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-5">
            {historyTickets.map((hTkt, idx) => (
              <div
                key={hTkt.id}
                className={`relative bg-white border-2 border-[#E8EFD9] rounded-[26px] p-4 flex items-center gap-3.5 shadow-xs ${
                  idx > 0 ? "-mt-3 pt-5" : ""
                }`}
              >
                <div className="w-[92px] h-[96px] shrink-0 flex items-center justify-center overflow-hidden rounded-[14px]">
                  <img
                    src={hTkt.myTicketsIllustration}
                    alt={hTkt.attractionName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 pr-16">
                  <h2 className="font-extrabold text-[18px] text-[#263B29] leading-tight">
                    {hTkt.attractionName}
                  </h2>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-[#6B665C]">
                    <svg
                      className="w-4 h-4 text-[#6B665C] shrink-0 -rotate-45"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                    <span className="truncate">
                      {hTkt.guestSummaryMyTickets}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-[#6B665C]">
                    <img
                      src="/assets/visitor/icon-calendar-days.svg"
                      alt=""
                      className="w-[15px] h-[16px] shrink-0"
                    />
                    <span>{hTkt.usedDateText || "25 Oct 2026"}</span>
                  </div>
                </div>

                <span className="absolute top-4 right-4 bg-[#E8EFD9] text-[#4D8B45] font-semibold text-[12.5px] px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <img
                    src="/assets/visitor/icon-check.svg"
                    alt=""
                    className="w-3.5 h-3.5"
                  />
                  <span>Used</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 5. PROFILE SCREEN (Exact Figma Node 398:1099 / steps/140/media_0.png)
  // ============================================================================
  const renderProfileScreen = () => (
    <div className="w-full pb-28 max-w-md mx-auto">
      <div className="relative w-full h-[230px] lg:rounded-t-[28px] overflow-hidden">
        <img
          src="/assets/visitor/profile-hero.png"
          alt="Profile Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10" />

        <button
          type="button"
          onClick={() => setActiveScreen("home")}
          aria-label="Back to Home"
          className="absolute top-5 left-5 w-[46px] h-[46px] flex items-center justify-center rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer z-20"
        >
          <img
            src="/assets/visitor/back-circle.svg"
            alt=""
            className="absolute inset-0 w-full h-full"
          />
          <img
            src="/assets/visitor/back-arrow.svg"
            alt=""
            className="relative w-[14px] h-[21px] -ml-0.5"
          />
        </button>

        <h1 className="absolute top-6 left-0 right-0 text-center font-bold text-[26px] text-white drop-shadow-md z-10">
          Profile
        </h1>

        <div className="absolute -bottom-9 left-[-15%] right-[-15%] h-20 bg-[#FFF4DC] rounded-t-[50%] z-10" />
      </div>

      <div className="relative z-20 -mt-20 px-5">
        <div className="w-[104px] h-[104px] rounded-full p-1.5 bg-white shadow-md mx-auto">
          <img
            src="/assets/visitor/profile-avatar.png"
            alt={authMode === "guest" ? "Guest" : userProfile.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* User Name & Subtitle (Guest Mode shows ONLY "Guest" — NO Guest ID) */}
        <div className="text-center mt-2">
          <h2 className="font-extrabold text-[24px] text-[#111111]">
            {authMode === "guest" ? "Guest" : userProfile.username}
          </h2>
          <p className="text-[13px] text-[#6B665C] mt-0.5">
            {authMode === "guest"
              ? "Visiting Scientia Square Park"
              : userProfile.email}
          </p>

          <div className="mt-3">
            <span className="inline-block bg-[#EDF6E9] text-[#263B29] font-semibold text-[12px] px-10 py-1.5 rounded-full">
              {authMode === "guest" ? "Guest Session" : "Manage Account"}
            </span>
          </div>
        </div>

        {profileSubView === "main" && (
          <div className="mt-6 space-y-3.5">
            {authMode === "google" ? (
              <button
                type="button"
                onClick={() => {
                  setEditProfileDraft(userProfile);
                  setProfileSubView("account-data");
                }}
                className="w-full bg-white hover:bg-[#EDF6E9]/40 border border-[#D8E7D2] rounded-[22px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-[44px] h-[44px] rounded-[14px] bg-[#EDF6E9] flex items-center justify-center shrink-0">
                    <img
                      src="/assets/visitor/icon-account-data.svg"
                      alt=""
                      className="w-[21px] h-[21px]"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-[#263B29]">
                      Account Data
                    </p>
                    <p className="text-[12px] text-[#6B665C]">
                      Change personal information
                    </p>
                  </div>
                </div>
                <img
                  src="/assets/visitor/icon-chevron-green.svg"
                  alt=""
                  className="w-[18px] h-[18px]"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowGoogleOAuthChooser(true)}
                className="w-full bg-white hover:bg-[#EDF6E9]/40 border border-[#D8E7D2] rounded-[22px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-[44px] h-[44px] rounded-[14px] bg-[#EDF6E9] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-[#263B29]">
                      Sign in with Google
                    </p>
                    <p className="text-[12px] text-[#6B665C]">
                      Save your tickets to your Google account
                    </p>
                  </div>
                </div>
                <img
                  src="/assets/visitor/icon-chevron-green.svg"
                  alt=""
                  className="w-[18px] h-[18px]"
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full bg-white hover:bg-[#FFF5F5] border border-[#E8EFD9] rounded-[22px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-[44px] h-[44px] rounded-[14px] bg-[#FDECE9] flex items-center justify-center shrink-0">
                  <img
                    src="/assets/visitor/icon-logout.svg"
                    alt=""
                    className="w-[21px] h-[21px]"
                  />
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#C94B3C]">
                    {authMode === "guest" ? "Exit Guest Session" : "Logout"}
                  </p>
                  <p className="text-[12px] text-[#6B665C]">
                    {authMode === "guest"
                      ? "Return to sign-in options"
                      : "Exit your account"}
                  </p>
                </div>
              </div>
              <img
                src="/assets/visitor/icon-chevron-red.svg"
                alt=""
                className="w-[18px] h-[18px]"
              />
            </button>
          </div>
        )}

        {profileSubView === "account-data" && (
          <div className="mt-6 bg-white rounded-[24px] p-5 border border-[#D8E7D2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EFD9] pb-3">
              <h3 className="font-bold text-[16px] text-[#263B29]">
                Account Data
              </h3>
              <button
                type="button"
                onClick={() => setProfileSubView("main")}
                className="text-[13px] font-bold text-[#4D8B45] cursor-pointer"
              >
                ← Back
              </button>
            </div>

            <div className="divide-y divide-[#E8EFD9] text-[14px]">
              <div className="py-2.5">
                <p className="text-[11px] font-bold uppercase text-[#6B665C]">
                  Username
                </p>
                <p className="font-bold text-[#263B29] mt-0.5">
                  {userProfile.username}
                </p>
              </div>
              <div className="py-2.5">
                <p className="text-[11px] font-bold uppercase text-[#6B665C]">
                  Email
                </p>
                <p className="font-bold text-[#263B29] mt-0.5">
                  {userProfile.email}
                </p>
              </div>
              <div className="py-2.5">
                <p className="text-[11px] font-bold uppercase text-[#6B665C]">
                  Phone Number
                </p>
                <p className="font-bold text-[#263B29] mt-0.5">
                  {userProfile.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditProfileDraft(userProfile);
                  setProfileSubView("edit-profile");
                }}
                className="bg-[#4D8B45] text-white font-bold text-[13px] py-2.5 rounded-full cursor-pointer"
              >
                Edit Account Data
              </button>
              <button
                type="button"
                onClick={() => setProfileSubView("change-password")}
                className="bg-[#E8EFD9] text-[#263B29] font-bold text-[13px] py-2.5 rounded-full cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {profileSubView === "edit-profile" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setUserProfile(editProfileDraft);
              setProfileSubView("account-data");
              triggerToast("Account profile updated!");
            }}
            className="mt-6 bg-white rounded-[24px] p-5 border border-[#D8E7D2] space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#E8EFD9] pb-2">
              <h3 className="font-bold text-[16px] text-[#263B29]">
                Edit Account Data
              </h3>
              <button
                type="button"
                onClick={() => setProfileSubView("account-data")}
                className="text-[12px] font-bold text-[#6B665C] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#263B29] mb-1">
                Username
              </label>
              <input
                type="text"
                value={editProfileDraft.username}
                onChange={(e) =>
                  setEditProfileDraft({
                    ...editProfileDraft,
                    username: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#D8E7D2] bg-[#FFF4DC]/40 text-[#263B29] font-semibold text-[14px]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#263B29] mb-1">
                Email
              </label>
              <input
                type="email"
                value={editProfileDraft.email}
                onChange={(e) =>
                  setEditProfileDraft({
                    ...editProfileDraft,
                    email: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#D8E7D2] bg-[#FFF4DC]/40 text-[#263B29] font-semibold text-[14px]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#263B29] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editProfileDraft.phone}
                onChange={(e) =>
                  setEditProfileDraft({
                    ...editProfileDraft,
                    phone: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#D8E7D2] bg-[#FFF4DC]/40 text-[#263B29] font-semibold text-[14px]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4D8B45] text-white font-bold text-[14px] py-2.5 rounded-full cursor-pointer"
            >
              Save Changes
            </button>
          </form>
        )}

        {profileSubView === "change-password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setShowPasswordSuccessModal(true);
            }}
            className="mt-6 bg-white rounded-[24px] p-5 border border-[#D8E7D2] space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#E8EFD9] pb-2">
              <h3 className="font-bold text-[16px] text-[#263B29]">
                Change Password
              </h3>
              <button
                type="button"
                onClick={() => setProfileSubView("account-data")}
                className="text-[12px] font-bold text-[#6B665C] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#263B29] mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#D8E7D2] bg-[#FFF4DC]/40 text-[#263B29]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#263B29] mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#D8E7D2] bg-[#FFF4DC]/40 text-[#263B29]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4D8B45] text-white font-bold text-[14px] py-2.5 rounded-full cursor-pointer"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );

  // Floating Bottom Navigation Pill (#4D8B45)
  const renderBottomNav = () => (
    <nav
      aria-label="Visitor Primary Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[335px] max-w-[92vw] h-[64px] bg-[#4D8B45] rounded-full shadow-[0px_6px_16px_rgba(0,0,0,0.25)] px-8 flex items-center justify-between"
    >
      <button
        type="button"
        onClick={() => setActiveScreen("home")}
        className={`flex flex-col items-center justify-center cursor-pointer transition-transform ${
          bottomNavTab === "home" ? "scale-105" : "opacity-85 hover:opacity-100"
        }`}
      >
        <img
          src="/assets/visitor/nav-home.svg"
          alt=""
          className="w-[32px] h-[32px]"
        />
        <span className="text-[11px] font-semibold text-white leading-none mt-0.5">
          Home
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveScreen("tickets")}
        className={`flex flex-col items-center justify-center cursor-pointer transition-transform ${
          bottomNavTab === "tickets"
            ? "scale-105"
            : "opacity-85 hover:opacity-100"
        }`}
      >
        <img
          src="/assets/visitor/nav-tickets.svg"
          alt=""
          className="w-[32px] h-[32px]"
        />
        <span className="text-[11px] font-semibold text-white leading-none mt-0.5">
          Tickets
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setProfileSubView("main");
          setActiveScreen("profile");
        }}
        className={`flex flex-col items-center justify-center cursor-pointer transition-transform ${
          bottomNavTab === "profile"
            ? "scale-105"
            : "opacity-85 hover:opacity-100"
        }`}
      >
        <img
          src="/assets/visitor/nav-profile.svg"
          alt=""
          className="w-[32px] h-[32px]"
        />
        <span className="text-[11px] font-semibold text-white leading-none mt-0.5">
          Profile
        </span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF4DC] text-[#263B29]">
      {/* ====================================================================
          DESKTOP / TABLET HEADER BAR (Automatically hidden on Mobile < 768px
          so mobile users get the pure edge-to-edge native Figma layout)
      ==================================================================== */}
      <header className="hidden md:block sticky top-0 z-50 bg-[#263B29] text-[#FFF4DC] border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveScreen("home")}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#4D8B45] flex items-center justify-center font-extrabold text-[#F2C94C] text-[15px]">
                SQP
              </div>
              <div>
                <p className="font-bold text-[14px] leading-tight text-white">
                  Scientia Square Park
                </p>
                <p className="text-[11px] text-[#A8C943] font-medium capitalize">
                  {device.category} View •{" "}
                  {authMode === "guest" ? "Guest" : userProfile.username}
                </p>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-1 ml-4 bg-white/5 p-1 rounded-full">
              <button
                type="button"
                onClick={() => setActiveScreen("login")}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "login"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                Login Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen("home")}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "home"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => openAttractionDetail(selectedAttractionId)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "attraction-detail"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                Attraction Detail
              </button>
              <button
                type="button"
                onClick={() => openTicketQueueView(currentTicket.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "ticket-queue"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                Queue Pass
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen("tickets")}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "tickets"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                My Tickets ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileSubView("main");
                  setActiveScreen("profile");
                }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  activeScreen === "profile"
                    ? "bg-[#4D8B45] text-white"
                    : "text-[#E8EFD9] hover:bg-white/10"
                }`}
              >
                Profile (
                {authMode === "guest" ? "Guest" : userProfile.username})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReceiptScannerModal(true)}
              className="bg-[#F2C94C] hover:bg-[#e5ba38] text-[#263B29] font-extrabold text-[11.5px] px-3 py-1.5 rounded-full shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span>📷 Scan Receipt (VLM)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen("login")}
              className="bg-white/10 hover:bg-white/20 text-[#FFF4DC] font-bold text-[11.5px] px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              {authMode === "guest" ? "Guest • Sign In" : userProfile.username}
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 md:top-20 right-5 z-50 bg-[#263B29] text-[#FFF4DC] border-2 border-[#A8C943] px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 max-w-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A8C943] shrink-0" />
          <p className="text-[13px] font-bold">{toastMessage}</p>
        </div>
      )}

      {/* ====================================================================
          MAIN VIEWPORT CONTAINER (Automatically adapts to Mobile, Tablet, Desktop)
      ==================================================================== */}
      <main className="flex-1 w-full">
        <div className="w-full md:max-w-6xl md:mx-auto md:px-4 lg:px-6">
          {activeScreen === "login" && renderLoginScreen()}
          {activeScreen === "home" && renderHomeScreen()}
          {activeScreen === "attraction-detail" &&
            renderAttractionDetailScreen()}
          {activeScreen === "ticket-queue" && renderTicketQueueScreen()}
          {activeScreen === "tickets" && renderTicketsAndHistoryScreen()}
          {activeScreen === "profile" && renderProfileScreen()}
        </div>
      </main>

      {/* Floating Bottom Navigation Pill */}
      {renderBottomNav()}

      {/* ====================================================================
          MODALS
      ==================================================================== */}

      {/* 1. "Use This Ticket?" Confirmation Modal */}
      {showUseTicketModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="use-ticket-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFF4DC] w-full max-w-[366px] rounded-[36px] px-6 py-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
            <h2
              id="use-ticket-title"
              className="font-extrabold text-[22px] text-[#263B29]"
            >
              Use This Ticket?
            </h2>
            <p className="font-normal text-[14.5px] text-[#263B29]/90 mt-3 leading-snug px-2">
              Are you sure you want to use this ticket?
              <br />
              This action cannot be undone
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleConfirmUseTicket}
                className="h-[52px] bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[16px] rounded-full transition-colors cursor-pointer"
              >
                Yes, Use Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowUseTicketModal(false)}
                className="h-[52px] bg-[#E8EFD9] hover:bg-[#d8e4c2] text-[#263B29] font-bold text-[16px] rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Google OAuth Account Chooser Preview Modal */}
      {showGoogleOAuthChooser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white w-full max-w-[380px] rounded-[28px] p-6 shadow-2xl text-[#263B29]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span className="text-[13px] font-semibold text-gray-600">
                  Sign in with Google (Preview)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleOAuthChooser(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-[16px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-[18px] text-gray-900">
                Choose an account
              </h3>
              <p className="text-[12.5px] text-gray-500 mt-0.5">
                to continue to{" "}
                <span className="font-semibold text-[#4D8B45]">
                  Scientia Square Park Queue
                </span>
              </p>

              <div className="mt-4 space-y-2">
                {[
                  {
                    username: "Kevcak",
                    fullName: "Kevin Cakrun",
                    email: "kevinCakrun@gmail.com",
                  },
                  {
                    username: "James",
                    fullName: "James Wijaya",
                    email: "james.wijaya@gmail.com",
                  },
                ].map((acct) => (
                  <button
                    key={acct.email}
                    type="button"
                    onClick={() => handleSignInWithGoogleAccount(acct)}
                    className="w-full p-3 rounded-2xl border border-gray-200 hover:bg-[#EDF6E9]/50 flex items-center gap-3 text-left transition-colors cursor-pointer"
                  >
                    <img
                      src="/assets/visitor/profile-avatar.png"
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[14px] text-gray-900 truncate">
                        {acct.fullName}
                      </p>
                      <p className="text-[12px] text-gray-500 truncate">
                        {acct.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="text-[12.5px] font-bold text-[#4D8B45] hover:underline cursor-pointer"
                >
                  Or continue as Guest (no ID shown)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. In-Browser Receipt VLM Scanner Modal */}
      {showReceiptScannerModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#FFF4DC] w-full max-w-xl rounded-[32px] p-6 shadow-2xl border-2 border-[#4D8B45]/25 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-[#E8EFD9] pb-3.5">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-[#4D8B45] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                  <span>In-Browser VLM</span>
                  <span>•</span>
                  <span>{vlmCaps.deviceBackend.toUpperCase()}</span>
                </span>
                <h2 className="font-extrabold text-[20px] text-[#263B29] mt-1">
                  Scan Park Receipt to Load Tickets
                </h2>
                <p className="text-[12px] text-[#6B665C]">
                  Model:{" "}
                  <code className="font-bold">{vlmCaps.recommendedModel}</code>{" "}
                  (~{vlmCaps.estimatedSizeMb} MB {vlmCaps.quantization})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptScannerModal(false)}
                className="w-8 h-8 rounded-full bg-[#E8EFD9] text-[#263B29] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-bold text-[#263B29]">
                  1. Select a Sample SQP Receipt or Capture Photo:
                </label>
                <label className="bg-[#E8EFD9] hover:bg-[#d8e5c3] text-[#4D8B45] font-bold text-[11.5px] px-3 py-1 rounded-full cursor-pointer">
                  <span>
                    📷 {device.isTouch ? "Open Camera" : "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture={device.isTouch ? "environment" : undefined}
                    onChange={handleReceiptFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_RECEIPT_PRESETS.map((preset) => {
                  const isSelected =
                    !uploadedReceiptPreview &&
                    selectedPresetReceipt.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setUploadedReceiptPreview(null);
                        setSelectedPresetReceipt(preset);
                        setLastScanResult(null);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#4D8B45] text-white border-[#4D8B45]"
                          : "bg-white text-[#263B29] border-[#D8E7D2] hover:bg-[#E8EFD9]/50"
                      }`}
                    >
                      <p className="font-extrabold text-[11px] truncate">
                        {preset.receiptId}
                      </p>
                      <p
                        className={`text-[10.5px] truncate mt-0.5 ${
                          isSelected ? "text-[#E8EFD9]" : "text-[#6B665C]"
                        }`}
                      >
                        {preset.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-dashed border-[#6B665C]/40 font-mono text-[11.5px] text-[#263B29] shadow-inner">
                {uploadedReceiptPreview ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={uploadedReceiptPreview.dataUrl}
                      alt="Uploaded Receipt"
                      className="w-24 h-32 object-cover rounded-xl border border-[#D8E7D2] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[12.5px] truncate">
                        Uploaded: {uploadedReceiptPreview.name}
                      </p>
                      <p className="text-[11px] text-[#6B665C] mt-0.5">
                        Processed Resolution: {uploadedReceiptPreview.width}×
                        {uploadedReceiptPreview.height}px
                      </p>
                      {lastScanResult && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-0.5 text-[11px]">
                          <p className="font-bold text-[#4D8B45]">
                            {lastScanResult.kiosk}
                          </p>
                          <p>Order Ref: {lastScanResult.orderRef}</p>
                          <p>Order Number: {lastScanResult.receiptId}</p>
                          <p>Date: {lastScanResult.timestamp}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {selectedPresetReceipt.imageUrl && (
                      <img
                        src={selectedPresetReceipt.imageUrl}
                        alt={selectedPresetReceipt.title}
                        className="w-24 h-32 object-cover rounded-xl border border-[#D8E7D2] shrink-0 mx-auto sm:mx-0"
                      />
                    )}
                    <div className="flex-1 w-full">
                      <div className="text-center border-b border-dashed border-gray-300 pb-2">
                        <p className="font-bold text-[12.5px]">SQP Park</p>
                        <p className="text-[10.5px] text-gray-500">
                          (021) 5961820 • https://scientiasquarepark.com
                        </p>
                        <p className="font-bold text-[11.5px] text-[#263B29] mt-0.5">
                          {selectedPresetReceipt.kiosk}
                        </p>
                      </div>
                      <div className="py-2 space-y-1.5">
                        {selectedPresetReceipt.items.map((it, i) => (
                          <div key={i}>
                            <div className="flex justify-between font-bold">
                              <span>{it.name}</span>
                              {it.promoNote && (
                                <span className="text-[10.5px] font-normal">
                                  {it.promoNote}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>
                                {it.qty} x {it.unitPrice} =
                              </span>
                              <span className="font-bold">{it.subtotal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dashed border-gray-300 pt-1.5 space-y-0.5 text-[11px]">
                        <div className="flex justify-between font-bold">
                          <span>TOTAL ({selectedPresetReceipt.paymentMethod})</span>
                          <span>{selectedPresetReceipt.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Total Tax</span>
                          <span>{selectedPresetReceipt.taxAmount}</span>
                        </div>
                        <div className="pt-1.5 mt-1 border-t border-dashed border-gray-200 text-center space-y-0.5">
                          <p className="font-bold text-[#4D8B45]">
                            Order Ref: {selectedPresetReceipt.orderRef}
                          </p>
                          <p className="font-extrabold text-[#263B29]">
                            Order Number: {selectedPresetReceipt.receiptId}
                          </p>
                          <p className="text-[10.5px] text-gray-500">
                            {selectedPresetReceipt.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isScanningReceipt}
                onClick={handleRunVlmReceiptScan}
                className="w-full h-[46px] bg-[#F2C94C] hover:bg-[#e5ba38] disabled:opacity-60 text-[#263B29] font-extrabold text-[14.5px] rounded-full shadow-xs cursor-pointer transition-all"
              >
                {isScanningReceipt
                  ? vlmStepText || "Scanning SQP Receipt..."
                  : "Scan Receipt & Extract Tickets"}
              </button>

              {lastScanResult && (
                <div className="bg-[#E8EFD9] rounded-2xl p-4 space-y-3 border border-[#4D8B45]/30">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div>
                      <p className="font-extrabold text-[13px] text-[#263B29]">
                        ✓ Order Number: {lastScanResult.receiptId}
                      </p>
                      <p className="text-[11px] font-semibold text-[#6B665C]">
                        Order Ref: {lastScanResult.orderRef} •{" "}
                        {lastScanResult.kiosk}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[#4D8B45]">
                      {lastScanResult.inferenceTimeMs} ms •{" "}
                      {(lastScanResult.confidence * 100).toFixed(1)}% conf
                    </span>
                  </div>

                  {/* Extracted Tickets Summary Cards */}
                  <div className="space-y-1.5">
                    {lastScanResult.tickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-[#4D8B45]/20"
                      >
                        <div>
                          <p className="font-extrabold text-[13.5px] text-[#263B29]">
                            {t.attractionName} ({t.guestSummaryMyTickets})
                          </p>
                          <p className="text-[11px] text-[#6B665C]">
                            Order Number: <span className="font-bold">{t.receiptId}</span>{" "}
                            • {t.validDateLine1}
                          </p>
                        </div>
                        <span className="bg-[#E8EFD9] text-[#4D8B45] font-bold text-[11px] px-2.5 py-1 rounded-full">
                          Ready
                        </span>
                      </div>
                    ))}
                  </div>

                  <pre className="bg-[#263B29] text-[#A8C943] p-3 rounded-xl text-[10.5px] overflow-x-auto max-h-36">
                    {lastScanResult.rawJsonPromptOutput}
                  </pre>

                  <button
                    type="button"
                    onClick={handleApplyScannedReceiptTickets}
                    className="w-full h-[46px] bg-[#4D8B45] hover:bg-[#3d7236] text-white font-bold text-[14px] rounded-full shadow-sm cursor-pointer"
                  >
                    Load {lastScanResult.tickets.length}{" "}
                    {lastScanResult.tickets.length === 1 ? "Ticket" : "Tickets"}{" "}
                    into My Tickets
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFF4DC] w-full max-w-[360px] rounded-[36px] p-7 text-center shadow-xl">
            <h2 className="font-bold text-[22px] text-[#263B29]">
              {authMode === "guest" ? "Exit Guest Session?" : "Logout?"}
            </h2>
            <p className="text-[14px] text-[#6B665C] mt-2">
              {authMode === "guest"
                ? "Return to the Scientia Square Park sign-in screen?"
                : `Are you sure you want to log out of ${userProfile.username}?`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  setActiveScreen("login");
                }}
                className="h-[48px] bg-[#C94B3C] text-white font-bold text-[15px] rounded-full cursor-pointer"
              >
                Yes, Exit
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="h-[48px] bg-[#E8EFD9] text-[#263B29] font-bold text-[15px] rounded-full cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Password Updated Modal */}
      {showPasswordSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFF4DC] w-full max-w-[350px] rounded-[36px] p-7 text-center shadow-xl">
            <h2 className="font-bold text-[21px] text-[#263B29]">
              Password Updated!
            </h2>
            <p className="text-[14px] text-[#6B665C] mt-2">
              Your account password has been changed successfully.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSuccessModal(false);
                setProfileSubView("account-data");
              }}
              className="mt-5 w-full max-w-[200px] py-2.5 bg-[#4D8B45] text-white font-bold text-[15px] rounded-full cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
