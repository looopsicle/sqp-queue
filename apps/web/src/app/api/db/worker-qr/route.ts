import { NextRequest, NextResponse } from "next/server";
import {
  createWorkerQrTicket,
  generateWorkerQrPngFile,
  listWorkerQrTicketsWithPng,
} from "../../../../lib/dbStore";

export const dynamic = "force-dynamic";

function resolveRequestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return "http://192.168.1.8:3000";
}

export async function GET(req: NextRequest) {
  const origin = resolveRequestOrigin(req);
  const qrs = await listWorkerQrTicketsWithPng(origin);
  return NextResponse.json({ qrs });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      posReceiptNumber?: string;
      attractionId?: string;
      adultCount?: number;
      childCount?: number;
      bundlingName?: string;
      issuedByWorker?: string;
      targetOrigin?: string;
    };

    const res = createWorkerQrTicket({
      posReceiptNumber: body.posReceiptNumber,
      attractionId: body.attractionId || "",
      adultCount: body.adultCount ?? 0,
      childCount: body.childCount ?? 0,
      bundlingName: body.bundlingName,
      issuedByWorker: body.issuedByWorker,
    });

    if (!res.ok || !res.qr) {
      const status = res.error?.includes("sudah pernah diterbitkan") ? 409 : 400;
      return NextResponse.json({ error: res.error }, { status });
    }

    const origin = body.targetOrigin || resolveRequestOrigin(req);
    const pngInfo = await generateWorkerQrPngFile(res.qr.claimCode, origin);
    const allQrs = await listWorkerQrTicketsWithPng(origin);
    const savedQr = allQrs.find((q) => q.id === res.qr!.id) || {
      ...res.qr,
      qrImageUrl: pngInfo.qrImageUrl,
      claimUrl: pngInfo.claimUrl,
    };

    return NextResponse.json({ qr: savedQr, qrs: allQrs }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Request body tidak valid." },
      { status: 400 }
    );
  }
}
