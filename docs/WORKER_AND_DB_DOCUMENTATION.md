# SQP Virtual Queue — Local Documentation & Worker / Superadmin Roadmap

**Branch:** `Visitor_POC_0` (uncommitted local work — not yet pushed to GitHub)  
**Last Updated:** 2026-11-16  
**Status:** Working local POC covering **Visitor Portal**, **Database Store + APIs**, and **Worker QR Issuance** (**SQP Express** & **Roll Glider**). Next planned phases focus first on completing the **Worker (`Staff/Petugas`) Portal**, followed by the **Superadmin (`Superadmin/Admin`) Portal** later.

> [!NOTE]
> Read alongside [POC_HANDOFF_GUIDE.md](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/docs/POC_HANDOFF_GUIDE.md), which documents the earlier front-end-only Visitor POC baseline (`55a5508`). This document captures everything added since then (Database, Account + Ticket persistence, URL-based QR generation/scanning, LAN mobile access) and lays out the build plan for Worker and Superadmin with **no code changes yet**.

---

## Part 1 — Documentation of Current Uncommitted Changes

### 1.1 Architecture Summary (What Exists Right Now)

```text
Visitor Phone / Browser (/)               Worker / Staff Browser (/worker)
         │                                               │
         ├─ Native camera scans QR URL                   ├─ Create Worker QR
         │  http://<LAN-IP>:3000/?claim=SQP-CLAIM-...   │  (SQP Express & Roll Glider only)
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Next.js App Router API Routes (@app/web)                                │
│  • GET / POST / PATCH /api/db/accounts                                  │
│  • GET / POST / PATCH /api/db/tickets                                   │
│  • GET / POST         /api/db/worker-qr                                 │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │
                                        ▼
                       JSON Database Store (dbStore.ts)
                        apps/web/.data/sqp-database.json
                       + Generated QR PNGs (qrcode lib):
                        apps/web/public/qr_codes/<claimCode>.png

(Parallel PostgreSQL Schema Ready in apps/api/prisma/schema.prisma:
 models Account, WorkerQrTicket, VisitorTicket — not yet wired to runtime APIs)
```

### 1.2 Database & Persistence Layer

1. **Runtime JSON Store — [dbStore.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/lib/dbStore.ts) & [dbTypes.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/data/dbTypes.ts)**
   - Persists data locally at `apps/web/.data/sqp-database.json` (git-ignored via [.gitignore](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/.gitignore#L66-L67)).
   - **Accounts (`DbAccountRecord` / `DbAccountPublic`)**:
     - Supports registered/Google-demo accounts and the Guest account (`acc-guest`, `isGuest: true`).
     - Guest accounts always display holder `"Guest"` with no visible Guest ID.
   - **Visitor Tickets (`DbVisitorTicket`)**:
     - Stored per `accountId`, tracking `receiptId`, `orderRef`, `claimCode`, `attractionId`, `queueStatus` (`"not_joined" | "in_queue" | "used"`), `queuePosition`, `queueNodes`, `estimatedBoardingTime`, `joinedQueueAt`, and `usedDateText`.
   - **Worker QR Tickets (`WorkerQrTicketRecord`)**:
     - Strictly scoped to **`sqp-express`** (`SQP Express`) and **`adventure-ropes`** (`Roll Glider`). Wall Climbing is excluded because it uses free passes directly in the visitor app.
     - Enforces uniqueness per `(posReceiptNumber, attractionId)` so one POS receipt cannot generate duplicate QR claim tickets for the same attraction.
     - Status lifecycle: `"AVAILABLE"` → `"CLAIMED"` (one-time claim into a visitor account).

2. **Prisma 7 PostgreSQL Schema — [schema.prisma](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/api/prisma/schema.prisma)**
   - Defines `Account`, `WorkerQrTicket` (with `@@unique([posReceiptNumber, attractionId])`), and `VisitorTicket` for future migration from `sqp-database.json` to Postgres (`apps/api`).

### 1.3 Next.js API Endpoints (`apps/web/src/app/api/db/`)

| Route | Methods | Purpose | Key Symbols / Actions |
|---|---|---|---|
| [/api/db/accounts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/accounts/route.ts) | `GET`, `POST`, `PATCH` | Manage visitor accounts & active tickets | `GET ?accountId=...` loads account + active/history tickets; `POST` supports `action: "register" \| "login" \| "switch"`; `PATCH` updates profile / password |
| [/api/db/tickets](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/tickets/route.ts) | `GET`, `POST`, `PATCH` | Ticket CRUD, Worker QR claiming, queue actions | `GET ?accountId=...`; `POST` handles `action: "claim-qr"` (transfers QR to account & allocates queue slot) and `"add-tickets"`; `PATCH` handles `join_queue`, `toggle_queue`, `use_ticket` |
| [/api/db/worker-qr](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/worker-qr/route.ts) | `GET`, `POST` | Issue & list Worker QR claim codes + PNGs | `GET` calls `listWorkerQrTicketsWithPng(origin)`; `POST` calls `createWorkerQrTicket` + `generateWorkerQrPngFile`, returning `201` (or `409` on duplicate receipt) |

### 1.4 Working QR Code Generator & Scanner (`hiwi` URL Pattern)

Adapted from the working QR implementation in `C:\Users\MSI\Desktop\hiwi`:
- **Libraries Added (`apps/web/package.json`)**: `qrcode` (`^1.5.4`), `jsqr` (`^1.4.0`), and `@types/qrcode` (`^1.5.6`).
- **Standard QR Encoding (`qrcode`, Error Correction Level `M`)**:
  - Client SVG renderer: [QrMatrixSvg.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/QrMatrixSvg.tsx) (`QRCode.create` with 3-module quiet zone).
  - Client codec & PNG card exporter: [qrTicketCodec.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/utils/qrTicketCodec.ts) (`DEFAULT_LAN_HOST = "192.168.1.8"`, `buildClaimUrl`, `extractClaimCodeFromQrPayload`, `decodeQrFromImageData`, `renderQrTicketCardPngDataUrl`, `decodeUploadedQrImage`).
  - Server PNG exporter: `generateWorkerQrPngFile` in [dbStore.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/lib/dbStore.ts#L56-L81) saves `320x320` PNG files into `apps/web/public/qr_codes/<claimCode>.png`.
- **Full Claim URL Payload**:
  - Every QR encodes `http://<LAN-IP>:3000/?claim=SQP-CLAIM-...` (default host `192.168.1.8:3000`, editable on `/worker` via **"Target URL / Host untuk Scan HP"**).
  - Scanning with a **phone's native camera app** opens the Visitor page directly and automatically triggers the `?claim=` auto-claim flow in [page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/page.tsx#L322-L416).
- **In-App Scanner (`jsqr` + `BarcodeDetector` fallback)**:
  - Uploaded `.png` QR cards are decoded client-side via `decodeUploadedQrImage`.
  - Live `<video>` frames are sampled onto an offscreen `<canvas>` and decoded via `decodeQrFromImageData` (`jsQR` with `inversionAttempts: "attemptBoth"`), with native `BarcodeDetector` fallback. (Note: browsers still require HTTPS or `localhost` for `getUserMedia` camera access; native phone camera scan via URL QR or image upload works over HTTP on LAN.)

### 1.5 Current Worker Portal POC ([apps/web/src/app/worker/page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/worker/page.tsx))

Refactored into a state container ([page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/worker/page.tsx)) plus modular UI components under `apps/web/src/components/worker/` (`workerTypes.ts`, `WorkerSidebar.tsx`, `WorkerTopBar.tsx`, `WorkerBerandaView.tsx`, `WorkerCreateQrForm.tsx`, `WorkerQrResultView.tsx`, `WorkerQrListView.tsx`, `WorkerPrintQrModal.tsx`). Currently implemented views in `/worker`:
- **Ride Scope Switcher**: Toggle between **SQP Express** (`sqp-express`) and **Roll Glider** (`adventure-ropes`).
- **`Beranda` (Basic Summary)**: Shows counts of `AVAILABLE` vs. `CLAIMED` Worker QRs and quick links to create a QR.
- **`Buat Tiket (QR)`**: Supports POS receipt mode (`Nomor struk POS *` + sample receipt generator) or preset `Bundling` packages, adult/child counters (`2–4 orang`), duplicate receipt blocking, QR Claim Card (`QrMatrixSvg` + editable LAN origin + Copy URL/Code), and `Print Modal` + `Download PNG QR`.
- **`Daftar QR`**: Lists generated Worker QRs with status (`AVAILABLE` / `CLAIMED`), claimant username, and quick print/download actions.

### 1.6 Running Locally, Mobile LAN Access & Troubleshooting

- **Start Dev Server**:
  ```powershell
  npm run dev:web
  ```
  Runs `next dev --hostname 0.0.0.0` on port `3000`.
- **LAN Access Config**: [next.config.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/next.config.ts) whitelists `192.168.1.8`, `192.168.1.*`, `10.100.1.*`, `192.168.*.*`, `172.*.*.*`, `localhost`, and `127.0.0.1` in `allowedDevOrigins`.
  - **Mobile checklist**: Connect phone & PC to the same Wi-Fi, verify PC IPv4 (currently `192.168.1.8` in `DEFAULT_LAN_HOST`), allow Node.js / port `3000` in Windows Firewall if prompted, and update **"Target URL / Host untuk Scan HP"** on `/worker` if your router assigns a new IP.
- **If `npm install` is run while `next dev` is open** (prevents `Cannot find module 'next/dist/compiled/loader-runner'` cached CSS errors):
  ```powershell
  # Stop next dev with Ctrl+C first, then clear cache & restart:
  Remove-Item -Recurse -Force apps/web/.next -ErrorAction SilentlyContinue
  npm run dev:web
  ```
- **Verification Commands**:
  ```powershell
  npx --workspace=@app/web tsc --noEmit
  npm run build --workspace=@app/web
  ```

### 1.7 Inventory of Uncommitted Files (`git status`)

- **Modified**:
  - `.gitignore` (ignores `apps/web/.data/` and `apps/web/public/qr_codes/`)
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/app.ts`
  - `apps/web/next.config.ts`
  - `apps/web/package.json` & `package-lock.json`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/page.tsx`
- **Untracked / New**:
  - `apps/web/src/data/dbTypes.ts`
  - `apps/web/src/lib/dbStore.ts`
  - `apps/web/src/app/api/db/accounts/route.ts`
  - `apps/web/src/app/api/db/tickets/route.ts`
  - `apps/web/src/app/api/db/worker-qr/route.ts`
  - `apps/web/src/components/QrMatrixSvg.tsx`
  - `apps/web/src/utils/qrTicketCodec.ts`
  - `apps/web/src/app/worker/page.tsx`
  - `apps/web/src/components/worker/workerTypes.ts`
  - `apps/web/src/components/worker/WorkerSidebar.tsx`
  - `apps/web/src/components/worker/WorkerTopBar.tsx`
  - `apps/web/src/components/worker/WorkerBerandaView.tsx`
  - `apps/web/src/components/worker/WorkerCreateQrForm.tsx`
  - `apps/web/src/components/worker/WorkerQrResultView.tsx`
  - `apps/web/src/components/worker/WorkerQrListView.tsx`
  - `apps/web/src/components/worker/WorkerPrintQrModal.tsx`
  - `docs/WORKER_AND_DB_DOCUMENTATION.md`
  - `docs/BRANCH_CHANGES_Visitor_POC_0.md`

---

## Part 2 — Next-Step Implementation Plan

> [!IMPORTANT]
> **Priority Order:** Build the **Worker (`Staff/Petugas`) Portal** completely first (Phases W1–W6). Build **Superadmin (`Superadmin/Admin`)** later (Phase S1+), using the operational state, staff audit logs, and incident reports generated by the Worker phases.

### 2.1 Primary Next Step: Worker Portal (`Staff/Petugas` — Figma Canvas `4:3`)

Currently `/worker` only covers **QR issuance (`Buat Tiket`)** for SQP Express & Roll Glider plus a minimal `Beranda` and `Daftar QR`. The Figma `Staff/Petugas` canvas defines a complete 6-module operational portal across **all 3 rides** (`SQP Express`, `Adventure Rope / Roll Glider`, and `Wall Climbing`), with menus dynamically adapted to each attraction and staff account.

#### Figma Node Map (`Staff/Petugas`, Canvas `4:3`)

| Screen / Popup | Figma Node ID | Rides Covered |
|---|---|---|
| `LOGIN` | `193:2` | Shared staff auth |
| `Beranda/Homepage/*` | `193:2793` (Kereta), `193:2858` (Adventure), `193:2923` (Wall Climbing) | All 3 rides |
| `Buat Ticket` + `QRCODE` + `Popup Cetak QR` | `193:2988`, `193:3050`, `193:3170`, `193:3568`, `193:4931`, `193:5277` | **SQP Express & Roll Glider only** (built in POC, needs audit/edit links & ride lock) |
| `Monitoring Antrean` | `193:3974` (Kereta), `193:4239` + `366:1002` (Adventure), `193:4504` (Wall Climbing) | All 3 rides |
| `Popup Buka / Jeda / Tutup antrean?` | `193:4890`, `193:4899`, `193:4908` | All 3 rides |
| `Pemeriksaan Pengunjung` | `193:4054` (Kereta), `193:4319` (Adventure), `193:4584` (Wall Climbing) | All 3 rides |
| `Catat Kendala Tiket` + `Popup Kendala dicatat` | `193:4116`, `193:4381`, `193:4646`, `193:4917` | All 3 rides |
| `Cari & Edit Tiket Visitor` + `Pop Up Alasan Edit` + `Popup Perubahan disimpan` | `193:4769`, `193:4825`, `193:6011`, `193:4924` | POS Ticket rides (SQP Express & Adventure Rope) |
| `Riwayat & Laporan` | `193:4175` (Kereta), `193:4440` (Adventure), `193:4705` (Wall Climbing) | All 3 rides |
| `Popup / Keluar dari Staff Portal?` | `193:4881` | Shared |

---

#### Phase W1 — Staff Authentication & Role-Scoped Ride Access
- **UI**: Build `/worker` login screen (`LOGIN`, Figma `193:2`):
  - Username / Email + Password (`kevin.sqp`, etc.), helper subtitle *"Wahana dan menu ditampilkan sesuai hak akses"*.
  - Signed-in sidebar displays assigned staff member & ride avatar (`SQP Express`, `Adventure Rope`, or `Wall Climbing`), plus `Keluar Akun` modal (`193:4881`).
  - Optional POC convenience switcher on `/worker` or pre-filled demo credentials per ride so testing all 3 rides stays fast while enforcing role-scoped UI once logged in.
- **Data & API**:
  - Add `StaffAccount` records to `dbStore.ts` (and later `schema.prisma`): `id`, `username`, `fullName`, `email`, `passwordHash`, `assignedAttractionId` (`sqp-express | adventure-ropes | wall-climbing`), `role` (`STAFF | SUPERVISOR`), `isActive`.
  - Add `/api/db/staff/auth` (`POST` login / logout / session check).
  - Restrict `Buat Tiket` menu visibility strictly to accounts assigned to `sqp-express` or `adventure-ropes` (hidden for `wall-climbing`, matching Figma `193:2923`).

#### Phase W2 — Full Staff Beranda (Per-Attraction Operational Summary)
- **UI**: Upgrade `Beranda` tab in `/worker` to match `193:2793`, `193:2858`, and `193:2923`:
  - Info banner (`Wahana aktif: <Attraction>`) + `Status operasional` card (`BUKA` / `JEDA` / `TUTUP`) explaining auto-dispatch vs. staff handling.
  - Live metric cards tailored per ride:
    - **SQP Express**: `Antrean menunggu (X batch)`, `Batch aktif (B-xxx)`, `Tiket diterbitkan (Hari ini)`.
    - **Adventure Rope**: `Antrean menunggu (X sesi — Roll Glider / Kiddy Rope / Rope Course)`, `Sesi aktif (S-xxx)`, `Peserta tercatat (Hari ini)`.
    - **Wall Climbing**: `Antrean menunggu (X peserta — Menggunakan free pass)`, `Slot aktif (A-xxx)`, `Free pass aktif (Tanpa transaksi POS)`.
  - `Aksi cepat` buttons:
    - SQP Express & Adventure Rope: *Buat Tiket dari Struk POS*, *Monitoring Antrean*, *Panduan Pemeriksaan Tiket*, plus *Cari & Edit Tiket*.
    - Wall Climbing: *Pantau Free Pass & Antrean* (no POS ticket button), *Monitoring Antrean*, *Panduan Pemeriksaan Tiket*.

#### Phase W3 — Monitoring Antrean & Live Queue Control (`Kontrol Operasional`)
- **UI**: Implement the `Monitoring` tab (`193:3974`, `193:4239`, `193:4504`):
  - Summary cards: Active Batch/Session/Slot (`B-012` / `S-021` / `A-017`), Next (`B-013` / `S-022` / `A-018`), Waiting count.
  - Queue list (`Daftar antrean`): `No.`, `Peserta`, `Giliran` (Batch / Roll Glider / Kiddy Rope / Rope Course / Slot), `Status` (`CALLED`, `QUEUED`, `COMPLETED`, `MISSED`).
  - `Kontrol Operasional` panel with confirmation modals (`Popup Buka / Jeda / Tutup antrean?`):
    - **Buka Antrean** (`BUKA`), **Jeda Antrean** (`JEDA`), **Tutup Antrean** (`TUTUP`).
    - For **Adventure Rope** (`366:1002`): **Mode kunjungan** toggle (`Off-peak` vs. `Peak`) dynamically updating capacity per batch & estimated duration.
    - System-assisted / staff-triggered queue advancement (marking current `CALLED` batch as `COMPLETED` or `MISSED` and promoting next `QUEUED` entries).
- **Data & API (Visitor ↔ Worker Live Sync)**:
  - Add `AttractionOperationalState` (`attractionId`, `operationalStatus: "OPEN" | "PAUSED" | "CLOSED"`, `seasonMode: "OFF_PEAK" | "PEAK"`, `activeCode`, `nextCode`, `batchCapacity`, `sessionDurationMin`, `updatedAt`) in `dbStore.ts` + `/api/db/operations`.
  - Sync Visitor app (`/`) to read live operational state and real queue counts instead of static `ATTRACTIONS` wait times, and update ticket `queueStatus` (`in_queue`, missed/called indicators).

#### Phase W4 — Pemeriksaan Pengunjung & Catat Kendala Tiket
- **UI**:
  - `Pemeriksaan` tab (`193:4054`, `193:4319`, `193:4584`):
    - Info callout: *"Tidak perlu scan QR atau klik validasi lagi — Petugas cukup mencocokkan halaman penggunaan tiket visitor."*
    - 4-point visual checklist (`01 Status tiket sudah USED`, `02 Wahana/aktivitas sesuai lokasi`, `03 Jumlah dan nama peserta sesuai`, `04 Giliran, batch, atau sesi sudah dipanggil`).
    - Decision panel: *"Izinkan pengunjung masuk"* vs. **`Catat Kendala`** CTA button.
  - `Catat Kendala Tiket` screen (`193:4116`, `193:4381`, `193:4646`):
    - Form fields: `Nomor struk / referensi tiket *`, `Jenis kendala *` (select: participant mismatch, wrong attraction/session, already used/expired, other), `Catatan petugas *`.
    - `Simpan & Teruskan Kendala` button + confirmation popup (`193:4917`).
    - Right-hand workflow & security rule card (*"Jangan aktifkan ulang tiket USED tanpa proses resmi"*).
- **Data & API**:
  - Add `IncidentReportRecord` in `dbStore.ts` + `/api/db/incidents` (`GET`, `POST`, `PATCH` status `OPEN | RESOLVED`).

#### Phase W5 — Cari & Edit Tiket Visitor (POS Corrections Only)
- **UI**:
  - Sub-flow accessible from `Buat Tiket` / `Aksi cepat` (`193:4769`, `193:4825`) for **SQP Express** & **Adventure Rope**:
    - Search by `Nomor struk POS *`, show attraction & status (`AVAILABLE` / `CLAIMED` / `USED`).
    - Allow editing `Jumlah peserta *` (`adultCount` / `childCount`) **only** when eligible (`AVAILABLE`, before `USED`/`EXPIRED`).
    - Saving opens `Pop Up Alasan Edit` (`193:6011`) requiring a reason note, then confirms with `Popup / Perubahan disimpan` (`193:4924`).
- **Data & API**:
  - Add `PATCH /api/db/worker-qr` (or ticket-correction action) + append an immutable `TicketEditLog` entry (`oldCount`, `newCount`, `reason`, `editedByWorker`, `timestamp`). If the ticket was already `CLAIMED` (not `USED`), synchronize the updated participant summary onto the visitor's `DbVisitorTicket` record as well.

#### Phase W6 — Riwayat & Laporan Operasional
- **UI**: Implement `Riwayat` tab (`193:4175`, `193:4440`, `193:4705`):
  - Filterable daily activity feed (`Waktu`, `Referensi`, `Aktivitas`, `Status`: `AVAILABLE`, `CLAIMED`, `COMPLETED`, `MISSED`, `USED`, `INCIDENT`, `EDITED`).
  - Pulls combined chronological events from Worker QRs, queue calls/completions, ticket edits, operational toggles (`BUKA`/`JEDA`/`TUTUP`), and incident reports filtered by attraction and date.

#### Suggested Build Sequence for Worker Side
1. **Refactor/modularize `/worker`**: Split `apps/web/src/app/worker/page.tsx` into components under `apps/web/src/components/worker/` (`WorkerLoginView`, `WorkerSidebar`, `WorkerBerandaView`, `CreateQrTicketView`, `QueueMonitoringView`, `VisitorCheckView`, `IncidentFormView`, `EditTicketView`, `WorkerHistoryView`) so it stays maintainable as all 6 modules are added.
2. **Backend first per slice**: Extend `dbTypes.ts`, `dbStore.ts`, and `schema.prisma` with `StaffAccount`, `AttractionOperationalState`, `IncidentReportRecord`, and `StaffActivityLog`, plus `/api/db/staff/*` routes.
3. **Wire UI modules incrementally**: Phase W1 (Auth & Ride Lock) → Phase W3 (Monitoring + Live Visitor Queue Sync) → Phase W4 (Pemeriksaan + Kendala) → Phase W5 (Edit Tiket + Audit Reason) → Phase W2 & W6 (Rich Beranda metrics + Full Riwayat log).

---

### 2.2 Later Phase: Superadmin Portal (`Superadmin/Admin` — Figma Canvas `4:4`)

> [!NOTE]
> Defer implementation until the Worker Portal and operational audit data are in place, since Superadmin aggregates live telemetry across all 3 rides and manages staff/attraction records.

#### Target Route & Responsive Layout
- Route: `/superadmin` (with desktop `1440×1024`, tablet `1280×800` `15:9`, and mobile `402×874` `15:7` views).
- Shared auth: Superadmin login (`193:5978`) & logout modal (`461:7007`), enforced by `role: "SUPERADMIN"`.

#### Planned Superadmin Modules (From Figma Canvas `4:4`)

| Section | Navigation Item | Figma Node | Capabilities |
|---|---|---|---|
| **Monitoring** | `Dashboard Antrean` | `15:11` | 4 global KPI cards (`Antrean Aktif`, `Tiket Dibuat`, `Tiket Digunakan`, `Tiket Dibatalkan`), 3 live `Kondisi Wahana` cards (capacity %, wait time, staff count, `Beroperasi` / `Dijeda`), hourly trend chart (`09.00–17.00`), recent `Aktivitas terbaru` feed |
| **Monitoring** | `Monitoring Antrean` | `106:483` | Cross-ride live queue inspection & supervisor override to open/pause/close rides or resolve escalated incidents |
| **Monitoring** | `Aktivitas Petugas` | `85:471` | Global audit stream of staff actions (calling batches, pausing queues, ticket edits, incident escalations) with search & date filter |
| **Monitoring** | `Statistik Tiket` | `85:123` | Period KPI summary, bar chart (`Jumlah Tiket per Wahana`), donut distribution (`Distribusi Tiket`), tabular breakdown (`Rincian laporan`), CSV/report export (`Export laporan`) |
| **Pengelolaan** | `Data Wahana` | `135:611`, `239:11188`, `245:11372` | Manage ride metadata, capacities, operating hours, and ticket rules (`Tambah Wahana`, `Edit Wahana`) |
| **Pengelolaan** | `Akun Petugas` | `135:857`, `317:191`–`346:153` | Create, edit, activate/deactivate staff accounts and assign attraction scopes (`SQP Express`, `Adventure Rope`, `Wall Climbing`) |
