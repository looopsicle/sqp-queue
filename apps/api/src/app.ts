import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, true] : true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SQP Queue API is running",
  });
});

// ============================================================================
// Accounts API (PostgreSQL + Prisma mirror of apps/web /api/db/accounts)
// ============================================================================
app.get("/api/db/accounts", async (req, res) => {
  try {
    const accountId =
      typeof req.query.accountId === "string" ? req.query.accountId : undefined;
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        isGuest: true,
        createdAt: true,
        _count: { select: { tickets: true } },
      },
    });
    const tickets = accountId
      ? await prisma.visitorTicket.findMany({
          where: { accountId },
          orderBy: { createdAt: "desc" },
        })
      : [];
    res.status(200).json({ accounts, tickets });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Database error",
    });
  }
});

app.post("/api/db/accounts", async (req, res) => {
  try {
    const body = req.body as {
      action?: string;
      username?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      identifier?: string;
    };

    if (body.action === "register") {
      if (!body.username || !body.email || !body.password) {
        res.status(400).json({ error: "Username, email, and password are required." });
        return;
      }
      const created = await prisma.account.create({
        data: {
          username: body.username.trim(),
          fullName: (body.fullName || body.username).trim(),
          email: body.email.trim().toLowerCase(),
          phone: (body.phone || "").trim(),
          passwordHash: body.password,
          isGuest: false,
        },
      });
      res.status(201).json({ account: created, tickets: [] });
      return;
    }

    if (body.action === "login") {
      const id = (body.identifier || "").trim();
      const account = await prisma.account.findFirst({
        where: {
          OR: [{ username: id }, { email: id.toLowerCase() }],
        },
      });
      if (!account || (body.password && account.passwordHash !== body.password)) {
        res.status(401).json({ error: "Invalid credentials." });
        return;
      }
      const tickets = await prisma.visitorTicket.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ account, tickets });
      return;
    }

    res.status(400).json({ error: "Unsupported action" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed account operation",
    });
  }
});

// ============================================================================
// Worker QR Generation API (SQP Express & Roll Glider only)
// ============================================================================
app.get("/api/db/worker-qr", async (_req, res) => {
  try {
    const qrs = await prisma.workerQrTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { claimedByAccount: { select: { username: true } } },
    });
    res.status(200).json({ qrs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Database error",
    });
  }
});

app.post("/api/db/worker-qr", async (req, res) => {
  try {
    const body = req.body as {
      posReceiptNumber?: string;
      attractionId?: string;
      bundlingName?: string;
      adultCount?: number;
      childCount?: number;
      issuedByWorker?: string;
    };

    if (body.attractionId !== "sqp-express" && body.attractionId !== "adventure-ropes") {
      res.status(400).json({
        error: "Worker QR generation only applies to SQP Express and Roll Glider.",
      });
      return;
    }

    const receipt = (body.posReceiptNumber || "").trim().toUpperCase();
    if (!receipt) {
      res.status(400).json({ error: "POS receipt number is required." });
      return;
    }

    const adultCount = Math.max(0, Number(body.adultCount || 0));
    const childCount = Math.max(0, Number(body.childCount || 0));
    const totalParticipants = adultCount + childCount;
    if (totalParticipants <= 0) {
      res.status(400).json({ error: "At least 1 participant is required." });
      return;
    }

    const cleanReceipt = receipt.replace(/[^A-Z0-9]/g, "");
    const suffix = body.attractionId === "sqp-express" ? "EXPRESS" : "ROPE";
    const claimCode = `SQP-CLAIM-${cleanReceipt}-${suffix}-${String(Date.now()).slice(-5)}`;

    const created = await prisma.workerQrTicket.create({
      data: {
        claimCode,
        posReceiptNumber: receipt,
        attractionId: body.attractionId,
        attractionName:
          body.attractionId === "sqp-express" ? "SQP Express" : "Adventure Ropes",
        activityName:
          body.attractionId === "sqp-express" ? "SQP Express" : "Roll Glider",
        bundlingName: body.bundlingName || null,
        adultCount,
        childCount,
        totalParticipants,
        status: "AVAILABLE",
        issuedByWorker:
          body.issuedByWorker ||
          (body.attractionId === "sqp-express"
            ? "Kevin.SQPExpress"
            : "Petugas.RollGlider"),
      },
    });
    res.status(201).json({ qr: created });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed creating Worker QR",
    });
  }
});

// ============================================================================
// Visitor Tickets API
// ============================================================================
app.get("/api/db/tickets", async (req, res) => {
  try {
    const accountId =
      typeof req.query.accountId === "string" ? req.query.accountId : "";
    if (!accountId) {
      res.status(400).json({ error: "accountId is required" });
      return;
    }
    const tickets = await prisma.visitorTicket.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ tickets });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Database error",
    });
  }
});

export default app;
