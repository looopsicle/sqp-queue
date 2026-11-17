import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import {
  ATTRACTIONS,
  AttractionId,
  INITIAL_HISTORY_TICKETS,
  INITIAL_TICKETS,
  VisitorTicket,
} from "../data/visitorData";
import {
  DbAccountPublic,
  DbAccountRecord,
  DbVisitorTicket,
  WorkerQrAttractionId,
  WorkerQrTicketRecord,
} from "../data/dbTypes";

interface SqpDatabaseFile {
  accounts: DbAccountRecord[];
  tickets: DbVisitorTicket[];
  workerQrs: WorkerQrTicketRecord[];
  nextQueueSeq: Record<AttractionId, number>;
  nextQrSeq: number;
}

function resolveWebRootDir(): string {
  const cwd = process.cwd();
  return fs.existsSync(path.join(cwd, "src", "app"))
    ? cwd
    : path.join(cwd, "apps", "web");
}

function resolveDbFilePath(): string {
  return path.join(resolveWebRootDir(), ".data", "sqp-database.json");
}

function normalizeLanOrigin(origin?: string): string {
  const raw = (origin || "http://192.168.1.8:3000").replace(/\/$/, "");
  if (
    raw.startsWith("http://localhost") ||
    raw.startsWith("https://localhost") ||
    raw.startsWith("http://127.0.0.1") ||
    raw.startsWith("https://127.0.0.1")
  ) {
    try {
      const u = new URL(raw);
      return `${u.protocol}//192.168.1.8${u.port ? `:${u.port}` : ""}`;
    } catch {
      return "http://192.168.1.8:3000";
    }
  }
  return raw;
}

export async function generateWorkerQrPngFile(
  claimCode: string,
  origin?: string
): Promise<{ qrImageUrl: string; claimUrl: string }> {
  const safeCode = claimCode.trim().toUpperCase();
  const base = normalizeLanOrigin(origin);
  const claimUrl = `${base}/?claim=${encodeURIComponent(safeCode)}`;
  const dir = path.join(resolveWebRootDir(), "public", "qr_codes");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${safeCode}.png`);
  await QRCode.toFile(filePath, claimUrl, {
    errorCorrectionLevel: "M",
    width: 320,
    margin: 2,
    color: {
      dark: "#183F2A",
      light: "#FFFFFF",
    },
  });
  return {
    qrImageUrl: `/qr_codes/${safeCode}.png`,
    claimUrl,
  };
}

export async function listWorkerQrTicketsWithPng(
  origin?: string
): Promise<WorkerQrTicketRecord[]> {
  const db = readDb();
  let mutated = false;
  for (const qr of db.workerQrs) {
    const filePath = path.join(
      resolveWebRootDir(),
      "public",
      "qr_codes",
      `${qr.claimCode}.png`
    );
    if (!qr.qrImageUrl || !qr.claimUrl || !fs.existsSync(filePath)) {
      const generated = await generateWorkerQrPngFile(qr.claimCode, origin);
      qr.qrImageUrl = generated.qrImageUrl;
      qr.claimUrl = generated.claimUrl;
      mutated = true;
    }
  }
  if (mutated) {
    writeDb(db);
  }
  return [...db.workerQrs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function formatTodayDateLine(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const m = months[now.getMonth()] || "nov";
  return `valid on ${dd} ${m} ${now.getFullYear()}`;
}

function formatShortUsedDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = months[now.getMonth()] || "Nov";
  return `${dd} ${m} ${now.getFullYear()}`;
}

function formatTimeDot(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}.${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function buildSeedDatabase(): SqpDatabaseFile {
  const nowIso = new Date().toISOString();

  const accounts: DbAccountRecord[] = [
    {
      id: "acc-kevcak",
      username: "Kevcak",
      fullName: "Kevin Cakrun",
      email: "kevinCakrun@gmail.com",
      phone: "+62 812-8890-4512",
      passwordHash: "sqp12345",
      isGuest: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      activeTicketCount: INITIAL_TICKETS.length,
      historyTicketCount: INITIAL_HISTORY_TICKETS.length,
    },
    {
      id: "acc-james",
      username: "JamesW",
      fullName: "James Wijaya",
      email: "james.wijaya@gmail.com",
      phone: "+62 811-2345-6789",
      passwordHash: "sqp12345",
      isGuest: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      activeTicketCount: 1,
      historyTicketCount: 0,
    },
    {
      id: "acc-guest",
      username: "Guest",
      fullName: "Guest",
      email: "",
      phone: "",
      passwordHash: "",
      isGuest: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      activeTicketCount: 0,
      historyTicketCount: 0,
    },
  ];

  const tickets: DbVisitorTicket[] = [
    ...INITIAL_TICKETS.map((t) => ({
      ...t,
      accountId: "acc-kevcak",
      holderName: "Kevcak",
      createdAt: nowIso,
    })),
    ...INITIAL_HISTORY_TICKETS.map((t) => ({
      ...t,
      accountId: "acc-kevcak",
      holderName: "Kevcak",
      createdAt: nowIso,
    })),
    {
      ...INITIAL_TICKETS[0],
      id: "tkt-james-wall-climbing",
      accountId: "acc-james",
      holderName: "JamesW",
      createdAt: nowIso,
    },
  ];

  const workerQrs: WorkerQrTicketRecord[] = [
    {
      id: "wqr-seed-express-1",
      claimCode: "SQP-CLAIM-6584-EXPRESS-00001",
      posReceiptNumber: "SQP-6584",
      attractionId: "sqp-express",
      attractionName: "SQP Express",
      activityName: "SQP Express",
      adultCount: 2,
      childCount: 2,
      totalParticipants: 4,
      status: "AVAILABLE",
      issuedByWorker: "Kevin.SQPExpress",
      createdAt: nowIso,
    },
    {
      id: "wqr-seed-rope-1",
      claimCode: "SQP-CLAIM-4821-ROPE-00002",
      posReceiptNumber: "4821",
      attractionId: "adventure-ropes",
      attractionName: "Adventure Ropes",
      activityName: "Roll Glider",
      adultCount: 2,
      childCount: 0,
      totalParticipants: 2,
      status: "AVAILABLE",
      issuedByWorker: "Petugas.RollGlider",
      createdAt: nowIso,
    },
  ];

  return {
    accounts,
    tickets,
    workerQrs,
    nextQueueSeq: {
      "sqp-express": 11,
      "wall-climbing": 6,
      "adventure-ropes": 9,
    },
    nextQrSeq: 3,
  };
}

function readDb(): SqpDatabaseFile {
  const filePath = resolveDbFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const seed = buildSeedDatabase();
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as SqpDatabaseFile;
  } catch {
    const seed = buildSeedDatabase();
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

function writeDb(db: SqpDatabaseFile): void {
  const filePath = resolveDbFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Keep derived counts accurate
  db.accounts = db.accounts.map((acc) => {
    const accTickets = db.tickets.filter((t) => t.accountId === acc.id);
    return {
      ...acc,
      activeTicketCount: accTickets.filter((t) => t.queueStatus !== "used")
        .length,
      historyTicketCount: accTickets.filter((t) => t.queueStatus === "used")
        .length,
    };
  });
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf8");
}

function sanitizeAccount(acc: DbAccountRecord): DbAccountPublic {
  return {
    id: acc.id,
    username: acc.username,
    fullName: acc.fullName,
    email: acc.email,
    phone: acc.phone,
    isGuest: acc.isGuest,
    createdAt: acc.createdAt,
    updatedAt: acc.updatedAt,
    activeTicketCount: acc.activeTicketCount,
    historyTicketCount: acc.historyTicketCount,
  };
}

export function listAccounts(): DbAccountPublic[] {
  const db = readDb();
  return db.accounts.map(sanitizeAccount);
}

export function getAccountWithTickets(accountId: string): {
  account: DbAccountPublic | null;
  activeTickets: DbVisitorTicket[];
  historyTickets: DbVisitorTicket[];
} {
  const db = readDb();
  const found = db.accounts.find((a) => a.id === accountId);
  if (!found) {
    return { account: null, activeTickets: [], historyTickets: [] };
  }
  const all = db.tickets.filter((t) => t.accountId === found.id);
  return {
    account: sanitizeAccount(found),
    activeTickets: all.filter((t) => t.queueStatus !== "used"),
    historyTickets: all.filter((t) => t.queueStatus === "used"),
  };
}

export function registerAccount(input: {
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  password: string;
}): {
  ok: boolean;
  error?: string;
  account?: DbAccountPublic;
  activeTickets?: DbVisitorTicket[];
  historyTickets?: DbVisitorTicket[];
} {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const phone = (input.phone || "").trim();
  const password = input.password;

  if (!username || username.length < 3) {
    return { ok: false, error: "Username minimal 3 karakter." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Email tidak valid." };
  }
  if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return {
      ok: false,
      error: "Password minimal 8 karakter dan mengandung huruf dan angka.",
    };
  }

  const db = readDb();
  const duplicate = db.accounts.find(
    (a) =>
      !a.isGuest &&
      (a.username.toLowerCase() === username.toLowerCase() ||
        a.email.toLowerCase() === email)
  );
  if (duplicate) {
    return {
      ok: false,
      error: "Username atau email sudah terdaftar di database.",
    };
  }

  const nowIso = new Date().toISOString();
  const newAcc: DbAccountRecord = {
    id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username,
    fullName: (input.fullName || username).trim(),
    email,
    phone: phone || "+62 812-0000-0000",
    passwordHash: password,
    isGuest: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    activeTicketCount: 0,
    historyTicketCount: 0,
  };

  db.accounts.push(newAcc);
  writeDb(db);

  return {
    ok: true,
    account: sanitizeAccount(newAcc),
    activeTickets: [],
    historyTickets: [],
  };
}

export function loginAccount(input: {
  identifier?: string;
  password?: string;
  accountId?: string;
  bypassPassword?: boolean;
}): {
  ok: boolean;
  error?: string;
  account?: DbAccountPublic;
  activeTickets?: DbVisitorTicket[];
  historyTickets?: DbVisitorTicket[];
} {
  const db = readDb();
  let found: DbAccountRecord | undefined;

  if (input.accountId) {
    found = db.accounts.find((a) => a.id === input.accountId);
  } else if (input.identifier) {
    const id = input.identifier.trim().toLowerCase();
    found = db.accounts.find(
      (a) =>
        !a.isGuest &&
        (a.username.toLowerCase() === id || a.email.toLowerCase() === id)
    );
  }

  if (!found) {
    return { ok: false, error: "Akun tidak ditemukan di database." };
  }

  if (!found.isGuest && !input.bypassPassword) {
    if (!input.password || found.passwordHash !== input.password) {
      return { ok: false, error: "Username/email atau password salah." };
    }
  }

  const all = db.tickets.filter((t) => t.accountId === found.id);
  return {
    ok: true,
    account: sanitizeAccount(found),
    activeTickets: all.filter((t) => t.queueStatus !== "used"),
    historyTickets: all.filter((t) => t.queueStatus === "used"),
  };
}

export function updateAccountProfile(input: {
  accountId: string;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}): { ok: boolean; error?: string; account?: DbAccountPublic } {
  const db = readDb();
  const idx = db.accounts.findIndex((a) => a.id === input.accountId);
  if (idx === -1) {
    return { ok: false, error: "Akun tidak ditemukan." };
  }
  const existing = db.accounts[idx];
  if (existing.isGuest) {
    return { ok: false, error: "Akun Guest tidak dapat diubah." };
  }

  if (input.newPassword !== undefined) {
    if (
      input.currentPassword !== undefined &&
      existing.passwordHash !== input.currentPassword
    ) {
      return { ok: false, error: "Password saat ini salah." };
    }
    if (input.newPassword.length < 8) {
      return { ok: false, error: "Password baru minimal 8 karakter." };
    }
    existing.passwordHash = input.newPassword;
  }

  if (input.username && input.username.trim()) {
    existing.username = input.username.trim();
  }
  if (input.fullName && input.fullName.trim()) {
    existing.fullName = input.fullName.trim();
  }
  if (input.email && input.email.trim()) {
    existing.email = input.email.trim().toLowerCase();
  }
  if (input.phone !== undefined) {
    existing.phone = input.phone.trim();
  }
  existing.updatedAt = new Date().toISOString();

  // Keep holderName in sync for active tickets
  db.tickets = db.tickets.map((t) =>
    t.accountId === existing.id && t.queueStatus !== "used"
      ? { ...t, holderName: existing.username }
      : t
  );

  writeDb(db);
  return { ok: true, account: sanitizeAccount(existing) };
}

export function listWorkerQrTickets(): WorkerQrTicketRecord[] {
  const db = readDb();
  return [...db.workerQrs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createWorkerQrTicket(input: {
  posReceiptNumber?: string;
  attractionId: string;
  adultCount: number;
  childCount: number;
  bundlingName?: string;
  issuedByWorker?: string;
}): { ok: boolean; error?: string; qr?: WorkerQrTicketRecord } {
  if (
    input.attractionId !== "sqp-express" &&
    input.attractionId !== "adventure-ropes"
  ) {
    return {
      ok: false,
      error:
        "Pembuatan QR Petugas hanya berlaku untuk wahana SQP Express dan Roll Glider.",
    };
  }

  const attractionId: WorkerQrAttractionId = input.attractionId;
  const adultCount = Math.max(0, Math.floor(Number(input.adultCount) || 0));
  const childCount = Math.max(0, Math.floor(Number(input.childCount) || 0));
  const totalParticipants = adultCount + childCount;

  if (totalParticipants <= 0) {
    return { ok: false, error: "Minimal harus ada 1 peserta." };
  }

  const db = readDb();
  const rawReceipt = (input.posReceiptNumber || "").trim().toUpperCase();
  const bundling = input.bundlingName?.trim();
  const posReceiptNumber =
    rawReceipt ||
    (bundling ? `BNDL-${String(db.nextQrSeq).padStart(4, "0")}` : "");

  if (!posReceiptNumber) {
    return {
      ok: false,
      error: "Nomor struk POS wajib diisi atau pilih paket bundling.",
    };
  }

  // Enforce duplicate check: one receipt number cannot be issued twice for the same ride
  const alreadyIssued = db.workerQrs.find(
    (q) =>
      q.posReceiptNumber.toUpperCase() === posReceiptNumber &&
      q.attractionId === attractionId
  );
  if (alreadyIssued) {
    return {
      ok: false,
      error: `Nomor struk POS "${posReceiptNumber}" sudah pernah diterbitkan QR (${alreadyIssued.claimCode}). Satu nomor struk tidak boleh diterbitkan dua kali.`,
    };
  }

  const seq = db.nextQrSeq++;
  const cleanCode = posReceiptNumber.replace(/[^A-Z0-9]/g, "") || "0000";
  const rideTag = attractionId === "sqp-express" ? "EXPRESS" : "ROPE";
  const claimCode = `SQP-CLAIM-${cleanCode}-${rideTag}-${String(seq).padStart(
    5,
    "0"
  )}`;

  const record: WorkerQrTicketRecord = {
    id: `wqr-${Date.now()}-${seq}`,
    claimCode,
    posReceiptNumber,
    attractionId,
    attractionName:
      attractionId === "sqp-express" ? "SQP Express" : "Adventure Ropes",
    activityName: attractionId === "sqp-express" ? "SQP Express" : "Roll Glider",
    bundlingName: bundling || undefined,
    adultCount,
    childCount,
    totalParticipants,
    status: "AVAILABLE",
    issuedByWorker:
      input.issuedByWorker ||
      (attractionId === "sqp-express"
        ? "Kevin.SQPExpress"
        : "Petugas.RollGlider"),
    createdAt: new Date().toISOString(),
  };

  db.workerQrs.unshift(record);
  writeDb(db);
  return { ok: true, qr: record };
}

function allocateQueueSlot(db: SqpDatabaseFile, attractionId: AttractionId) {
  const num = db.nextQueueSeq[attractionId] || 10;
  db.nextQueueSeq[attractionId] = num + 1;
  const prefix =
    attractionId === "sqp-express"
      ? "B2N"
      : attractionId === "adventure-ropes"
      ? "R3N"
      : "W1N";
  const pad = (n: number) => `${prefix}${String(n).padStart(2, "0")}`;
  const nodes = [pad(num - 4), pad(num - 3), pad(num - 2), pad(num - 1), "YOU"];
  return { position: pad(num), nodes };
}

export function claimWorkerQrToAccount(input: {
  claimCode: string;
  accountId: string;
}): {
  ok: boolean;
  error?: string;
  qr?: WorkerQrTicketRecord;
  ticket?: DbVisitorTicket;
  activeTickets?: DbVisitorTicket[];
  historyTickets?: DbVisitorTicket[];
} {
  const normalizedCode = input.claimCode.trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, error: "Kode QR klaim tidak boleh kosong." };
  }

  const db = readDb();
  const account = db.accounts.find((a) => a.id === input.accountId);
  if (!account) {
    return { ok: false, error: "Akun tidak ditemukan di database." };
  }

  const qrIdx = db.workerQrs.findIndex(
    (q) =>
      q.claimCode.toUpperCase() === normalizedCode ||
      q.posReceiptNumber.toUpperCase() === normalizedCode
  );
  if (qrIdx === -1) {
    return {
      ok: false,
      error: `Kode QR "${normalizedCode}" tidak terdaftar di sistem petugas.`,
    };
  }

  const qr = db.workerQrs[qrIdx];
  if (qr.status === "CLAIMED") {
    return {
      ok: false,
      error: `QR "${qr.claimCode}" sudah diklaim oleh ${
        qr.claimedByUsername || "pengunjung lain"
      } dan tidak dapat digunakan ulang.`,
    };
  }

  const holderName = account.isGuest ? "Guest" : account.username;
  const nowIso = new Date().toISOString();

  qr.status = "CLAIMED";
  qr.claimedByAccountId = account.id;
  qr.claimedByUsername = holderName;
  qr.claimedAt = nowIso;

  const attr = ATTRACTIONS[qr.attractionId];
  const slot = allocateQueueSlot(db, qr.attractionId);
  const isExpress = qr.attractionId === "sqp-express";
  const unitWord = isExpress ? "Passengers" : "Guests";

  const breakdownText =
    qr.adultCount > 0 && qr.childCount > 0
      ? `${qr.adultCount} dewasa · ${qr.childCount} anak`
      : qr.childCount > 0
      ? `${qr.childCount} anak`
      : `${qr.adultCount} dewasa`;

  const newTicket: DbVisitorTicket = {
    id: `tkt-${qr.claimCode.toLowerCase()}-${Date.now()}`,
    accountId: account.id,
    claimCode: qr.claimCode,
    receiptId: qr.posReceiptNumber,
    orderRef: qr.claimCode,
    attractionId: qr.attractionId,
    attractionName: isExpress ? "SQP Express" : "Adventure Ropes (Roll Glider)",
    cardThumbImage: isExpress
      ? "/assets/visitor/ticket-sqp-express.png"
      : "/assets/visitor/adventure-ropes.png",
    myTicketsIllustration: attr.ticketIllustration,
    myTicketsBg: attr.ticketCardBg,
    guestSummaryHome:
      qr.totalParticipants === 1
        ? "1 Person"
        : `${qr.totalParticipants} members`,
    guestSummaryMyTickets: `1 Ticket • ${qr.totalParticipants} ${unitWord}`,
    holderName,
    membersLabel: `${qr.totalParticipants} ${
      qr.totalParticipants === 1 ? "Member" : "Members"
    } (${breakdownText})`,
    validDateLine1: formatTodayDateLine(),
    validDateLine2: "08.00 - 18.00",
    includes: isExpress
      ? [
          `${qr.totalParticipants} passengers (${breakdownText})`,
          "1x Train Ride per Passenger",
          `POS Receipt #${qr.posReceiptNumber}`,
          `Claim QR: ${qr.claimCode}`,
        ]
      : [
          `${qr.totalParticipants} Roll Glider riders (${breakdownText})`,
          "Full safety harness & helmet included",
          `POS Receipt #${qr.posReceiptNumber}`,
          `Claim QR: ${qr.claimCode}`,
        ],
    queueStatus: "not_joined",
    queuePosition: slot.position,
    queueNodes: slot.nodes,
    estimatedBoardingTime: "16:30",
    joinedQueueAt: formatTimeDot(),
    createdAt: nowIso,
  };

  db.tickets.unshift(newTicket);
  writeDb(db);

  const allAccTickets = db.tickets.filter((t) => t.accountId === account.id);
  return {
    ok: true,
    qr,
    ticket: newTicket,
    activeTickets: allAccTickets.filter((t) => t.queueStatus !== "used"),
    historyTickets: allAccTickets.filter((t) => t.queueStatus === "used"),
  };
}

export function addTicketsToAccount(input: {
  accountId: string;
  tickets: VisitorTicket[];
}): {
  ok: boolean;
  error?: string;
  activeTickets?: DbVisitorTicket[];
  historyTickets?: DbVisitorTicket[];
} {
  const db = readDb();
  const account = db.accounts.find((a) => a.id === input.accountId);
  if (!account) {
    return { ok: false, error: "Akun tidak ditemukan." };
  }

  const holderName = account.isGuest ? "Guest" : account.username;
  const nowIso = new Date().toISOString();

  const created: DbVisitorTicket[] = input.tickets.map((t, i) => ({
    ...t,
    id: `tkt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    accountId: account.id,
    holderName,
    createdAt: nowIso,
  }));

  db.tickets = [...created, ...db.tickets];
  writeDb(db);

  const all = db.tickets.filter((t) => t.accountId === account.id);
  return {
    ok: true,
    activeTickets: all.filter((t) => t.queueStatus !== "used"),
    historyTickets: all.filter((t) => t.queueStatus === "used"),
  };
}

export function updateAccountTicketAction(input: {
  accountId: string;
  ticketId: string;
  action: "join_queue" | "toggle_queue" | "use_ticket";
}): {
  ok: boolean;
  error?: string;
  ticket?: DbVisitorTicket;
  activeTickets?: DbVisitorTicket[];
  historyTickets?: DbVisitorTicket[];
} {
  const db = readDb();
  const idx = db.tickets.findIndex(
    (t) => t.id === input.ticketId && t.accountId === input.accountId
  );
  if (idx === -1) {
    return { ok: false, error: "Tiket tidak ditemukan di akun ini." };
  }

  const target = db.tickets[idx];
  if (input.action === "join_queue") {
    target.queueStatus = "in_queue";
    target.joinedQueueAt = formatTimeDot();
  } else if (input.action === "toggle_queue") {
    target.queueStatus =
      target.queueStatus === "in_queue" ? "not_joined" : "in_queue";
    if (target.queueStatus === "in_queue") {
      target.joinedQueueAt = formatTimeDot();
    }
  } else if (input.action === "use_ticket") {
    target.queueStatus = "used";
    target.usedDateText = formatShortUsedDate();
    target.myTicketsBg = "#FFFFFF";
  }

  writeDb(db);
  const all = db.tickets.filter((t) => t.accountId === input.accountId);
  return {
    ok: true,
    ticket: target,
    activeTickets: all.filter((t) => t.queueStatus !== "used"),
    historyTickets: all.filter((t) => t.queueStatus === "used"),
  };
}
