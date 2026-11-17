import QRCode from "qrcode";
import jsQR from "jsqr";
import { WorkerQrTicketRecord } from "../data/dbTypes";

export const DEFAULT_LAN_HOST = "192.168.1.8";

/**
 * Builds the scannable claim URL encoded inside every Worker QR code
 * (matching hiwi's pattern of encoding the full reachable URL so native
 * phone cameras open the claim flow directly).
 */
export function buildClaimUrl(
  claimCode: string,
  customOrigin?: string
): string {
  const code = claimCode.trim().toUpperCase();
  let baseOrigin = customOrigin?.trim().replace(/\/$/, "");

  if (!baseOrigin && typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    if (host === "localhost" || host === "127.0.0.1") {
      baseOrigin = `${window.location.protocol}//${DEFAULT_LAN_HOST}${port || ":3000"}`;
    } else {
      baseOrigin = window.location.origin;
    }
  }

  if (!baseOrigin) {
    baseOrigin = `http://${DEFAULT_LAN_HOST}:3000`;
  }

  return `${baseOrigin}/?claim=${encodeURIComponent(code)}`;
}

/**
 * Extracts `SQP-CLAIM-...` from either a scanned URL (`http://.../?claim=SQP-CLAIM-...`)
 * or a raw `SQP-CLAIM-...` string.
 */
export function extractClaimCodeFromQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const param = url.searchParams.get("claim") || url.searchParams.get("qr");
      if (param) {
        return param.trim().toUpperCase();
      }
    }
  } catch {
    // Fallback to regex extraction below
  }

  const claimParamMatch = trimmed.match(/[?&](?:claim|qr)=([^&\s]+)/i);
  if (claimParamMatch) {
    try {
      return decodeURIComponent(claimParamMatch[1]).trim().toUpperCase();
    } catch {
      return claimParamMatch[1].trim().toUpperCase();
    }
  }

  const directMatch = trimmed.toUpperCase().match(/SQP-CLAIM-[A-Z0-9-]+/);
  if (directMatch) {
    return directMatch[0];
  }

  return trimmed.toUpperCase();
}

/**
 * Decodes a QR code directly from canvas ImageData pixels using jsQR.
 */
export function decodeQrFromImageData(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  if (result?.data) {
    return extractClaimCodeFromQrPayload(result.data);
  }
  return null;
}

/**
 * Generates a PNG Data URL of just the QR code (for verification or bare PNG export).
 */
export async function generateRawQrPngDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: 320,
    margin: 2,
    color: {
      dark: "#183F2A",
      light: "#FFFFFF",
    },
  });
}

/**
 * Generates a printable/downloadable QR ticket PNG card using `qrcode` (ECC Level M)
 * encoding the full visitor claim URL so any phone camera or in-app scanner works.
 */
export async function renderQrTicketCardPngDataUrl(
  qr: WorkerQrTicketRecord,
  customOrigin?: string
): Promise<string> {
  const claimUrl = buildClaimUrl(qr.claimCode, customOrigin);
  const qrDataUrl = await QRCode.toDataURL(claimUrl, {
    errorCorrectionLevel: "M",
    width: 280,
    margin: 2,
    color: {
      dark: "#183F2A",
      light: "#FFFFFF",
    },
  });

  const width = 440;
  const height = 560;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  ctx.fillStyle = "#FFF4DC";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#4D8B45";
  ctx.fillRect(0, 0, width, 92);

  ctx.fillStyle = "#F2C94C";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SCIENTIA SQUARE PARK • TIKET KLAIM QR", width / 2, 32);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(qr.activityName.toUpperCase(), width / 2, 66);

  const boxSize = 288;
  const boxX = (width - boxSize) / 2;
  const boxY = 114;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(boxX, boxY, boxSize, boxSize);
  ctx.strokeStyle = "#DFE8DD";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxSize, boxSize);

  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });
  ctx.drawImage(qrImg, boxX + 4, boxY + 4, 280, 280);

  ctx.fillStyle = "#183F2A";
  ctx.font = "bold 15px monospace";
  ctx.textAlign = "center";
  ctx.fillText(qr.claimCode, width / 2, 434);

  ctx.fillStyle = "#4D8B45";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(
    `Struk POS: ${qr.posReceiptNumber}  •  ${qr.totalParticipants} Orang`,
    width / 2,
    468
  );

  ctx.fillStyle = "#617368";
  ctx.font = "13px sans-serif";
  ctx.fillText(
    `(${qr.adultCount} dewasa · ${qr.childCount} anak)`,
    width / 2,
    494
  );
  ctx.fillText(
    "Scan dengan Kamera HP atau Portal Visitor untuk klaim tiket",
    width / 2,
    522
  );

  return canvas.toDataURL("image/png");
}

export async function decodeUploadedQrImage(file: File): Promise<{
  claimCode: string | null;
  rawPayload: string | null;
  method: "jsqr" | "barcode-detector" | "tesseract-ocr" | "none";
  previewUrl: string;
}> {
  const previewUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = previewUrl;
  });

  // 1. Primary: jsQR pixel decoder (works in all desktop & mobile browsers)
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (qrResult?.data) {
      return {
        claimCode: extractClaimCodeFromQrPayload(qrResult.data),
        rawPayload: qrResult.data,
        method: "jsqr",
        previewUrl,
      };
    }
  }

  // 2. Secondary: Native BarcodeDetector API if available
  type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
    detect: (src: ImageBitmapSource) => Promise<{ rawValue?: string }[]>;
  };
  const win = window as unknown as {
    BarcodeDetector?: BarcodeDetectorCtor;
  };
  if (typeof win.BarcodeDetector === "function") {
    try {
      const detector = new win.BarcodeDetector({ formats: ["qr_code"] });
      const results = await detector.detect(img);
      const val = results.find((r) => Boolean(r.rawValue))?.rawValue;
      if (val) {
        return {
          claimCode: extractClaimCodeFromQrPayload(val),
          rawPayload: val,
          method: "barcode-detector",
          previewUrl,
        };
      }
    } catch {
      // Continue to OCR fallback
    }
  }

  // 3. Fallback: scan text printed below QR via Tesseract WASM OCR
  try {
    const Tesseract = await import("tesseract.js");
    const {
      data: { text },
    } = await Tesseract.recognize(previewUrl, "eng");
    const match = text
      .toUpperCase()
      .replace(/\s+/g, "")
      .match(/SQP-CLAIM-[A-Z0-9-]+/);
    if (match) {
      return {
        claimCode: match[0],
        rawPayload: match[0],
        method: "tesseract-ocr",
        previewUrl,
      };
    }
  } catch {
    // Ignore
  }

  return {
    claimCode: null,
    rawPayload: null,
    method: "none",
    previewUrl,
  };
}
