# Branch Release Notes — `Visitor_POC_0`

**Target Branch:** `Visitor_POC_0`  
**Base Commit:** `b002f93` (`feat: add docker-compose configuration for postgres and pgadmin with environment variables`)  
**Scope:** **8** modified tracked files (`+2,126 / -246` lines across tracked files) and **18** new files (including this document) ready to commit and push.

---

## 1. Suggested Commit & PR Summary

### Commit Message
```text
feat(web,api): add account/ticket database, worker QR portal, and URL QR scanner
```

### High-Level Summary
- Added persistent local account & ticket database storage ([dbStore.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/lib/dbStore.ts)) with Next.js API routes (`/api/db/accounts`, `/api/db/tickets`, `/api/db/worker-qr`), plus Prisma 7 schema models and initial Express endpoints in `apps/api`.
- Built and modularized the Worker Staff Portal at `/worker` for issuing POS-backed claim QR codes strictly for **SQP Express** and **Roll Glider** (split into container + 8 modular files under `apps/web/src/components/worker/`).
- Replaced the custom QR renderer with standard `qrcode` + `jsqr` encoding reachable LAN claim URLs (`http://<LAN-IP>:3000/?claim=SQP-CLAIM-...`) so visitors can scan directly with a phone's native camera, upload QR PNGs, or use the live `<video>` camera scanner.
- Updated Visitor Portal (`/`) to support database-backed account registration, login, quick switching, Guest mode (without any Guest ID), `?claim=` auto-claiming, and dual-mode QR/receipt claiming.

---

## 2. Detailed Changes by Area

### 2.1 Account, Ticket & Worker QR Persistence (`apps/web` + `apps/api`)
- **Runtime Database Engine & Types:**
  - Created [dbTypes.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/data/dbTypes.ts) defining `DbAccountPublic`, `DbAccountRecord`, `DbVisitorTicket`, `WorkerQrAttractionId` (`"sqp-express" | "adventure-ropes"`), and `WorkerQrTicketRecord`.
  - Created [dbStore.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/lib/dbStore.ts) managing `apps/web/.data/sqp-database.json` (seed accounts, ticket CRUD, queue join/leave/`USED` transitions, duplicate POS receipt prevention per attraction, `claimWorkerQrToAccount`, and server-side QR PNG generation via `generateWorkerQrPngFile`).
- **Next.js API Route Handlers (`apps/web/src/app/api/db/`):**
  - [/api/db/accounts/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/accounts/route.ts): `GET` (list accounts or load `?accountId=...` with active/history tickets), `POST` (`register`, `login`, `switch`), `PATCH` (update profile & password).
  - [/api/db/tickets/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/tickets/route.ts): `GET`, `POST` (`claim-qr`, `add-tickets`), `PATCH` (`join_queue`, `toggle_queue`, `use_ticket`).
  - [/api/db/worker-qr/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/worker-qr/route.ts): `GET` (list issued QRs with generated PNG URLs) and `POST` (issue new QR for **SQP Express** or **Roll Glider**, returning `409` on duplicate `(posReceiptNumber, attractionId)`).
- **Prisma Schema & Express Mirror (`apps/api`):**
  - Updated [schema.prisma](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/api/prisma/schema.prisma) with PostgreSQL models `Account`, `WorkerQrTicket`, and `VisitorTicket`.
  - Updated [app.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/api/src/app.ts) with initial Express + Prisma endpoints mirroring `/api/db/accounts`, `/api/db/worker-qr`, and `GET /api/db/tickets` (note: Next.js routes in `apps/web` remain the active runtime backend for this POC).

### 2.2 Visitor Portal Integration (`apps/web/src/app/page.tsx`)
- Wired [page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/page.tsx) to `/api/db/*`:
  - Database-backed account registration, sign-in, quick account switching, profile editing, password change, and `localStorage` active account persistence.
  - Guest mode continues using `"Guest"` on tickets with **no Guest ID** shown anywhere.
  - Added startup `?claim=` / `?qr=` query-parameter handling so scanning a Worker QR URL with a phone camera automatically claims the ticket into the active visitor account and opens **My Tickets**.
  - Updated modal #3 (`Scan / Upload Tiket`) to support **Worker QR Claim** (live `<video>` camera scanning via `jsqr` + `BarcodeDetector` fallback, `.png` QR upload decoding, manual code/URL paste, and 1-click active DB QR selection) alongside POS receipt scanning.

### 2.3 Modular Worker Portal (`/worker` — SQP Express & Roll Glider)
- Refactored `/worker` into [apps/web/src/app/worker/page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/worker/page.tsx) (`280` lines) plus 8 modular files in `apps/web/src/components/worker/`:
  - [workerTypes.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/workerTypes.ts) — tab/mode types, `BUNDLING_OPTIONS`, and `getWorkerAttractionMeta`.
  - [WorkerSidebar.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerSidebar.tsx) — Staff navigation sidebar, SQP Express / Roll Glider switcher, `next/image` worker avatar.
  - [WorkerTopBar.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerTopBar.tsx) — Header bar with conditional back button and active ride badge.
  - [WorkerBerandaView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerBerandaView.tsx) — `AVAILABLE` vs. `CLAIMED` summary metrics and quick QR creation buttons.
  - [WorkerCreateQrForm.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerCreateQrForm.tsx) — POS receipt vs. Bundling form, `ParticipantStepper` helper, validation notice, and transaction summary.
  - [WorkerQrResultView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerQrResultView.tsx) — URL QR card, editable **Target URL / Host untuk Scan HP**, copy URL/code buttons, print/PNG controls, and ticket details.
  - [WorkerQrListView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerQrListView.tsx) — Issued QR database list with live refresh, claimant username, inspect, and PNG export buttons.
  - [WorkerPrintQrModal.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerPrintQrModal.tsx) — Printable modal dialog showing QR, claim code, claim URL, PNG download, and print button.

### 2.4 Standard QR Encoding & Scanning (`hiwi` Pattern)
- Added dependencies `qrcode` (`^1.5.4`), `jsqr` (`^1.4.0`), and `@types/qrcode` (`^1.5.6`) in [apps/web/package.json](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/package.json) and [package-lock.json](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/package-lock.json).
- Created [qrTicketCodec.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/utils/qrTicketCodec.ts) (`DEFAULT_LAN_HOST = "192.168.1.8"`, `buildClaimUrl`, `extractClaimCodeFromQrPayload`, `decodeQrFromImageData`, `renderQrTicketCardPngDataUrl`, `decodeUploadedQrImage`) and [QrMatrixSvg.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/QrMatrixSvg.tsx).

### 2.5 Config, CSS Cache Fix & Documentation
- [apps/web/next.config.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/next.config.ts): Added `"192.168.1.8"` and `"192.168.1.*"` to `allowedDevOrigins` for mobile Wi-Fi dev testing.
- [.gitignore](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/.gitignore): Added `apps/web/.data/` and `apps/web/public/qr_codes/` so runtime local DB snapshots and generated QR PNGs stay untracked.
- [apps/web/src/app/globals.css](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/globals.css): Added header token comment above `:root` (invalidated stale Turbopack loader cache).
- [docs/WORKER_AND_DB_DOCUMENTATION.md](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/docs/WORKER_AND_DB_DOCUMENTATION.md): Local technical reference and phased roadmap for Worker (next) and Superadmin (later).

---

## 3. Complete File Manifest (To Be Committed)

### Modified Tracked Files (8)

| File | Role in This Release |
|---|---|
| [.gitignore](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/.gitignore) | Ignore runtime `apps/web/.data/` and `apps/web/public/qr_codes/` |
| [apps/api/prisma/schema.prisma](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/api/prisma/schema.prisma) | Prisma `Account`, `WorkerQrTicket`, `VisitorTicket` models |
| [apps/api/src/app.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/api/src/app.ts) | Express `/api/db/accounts`, `/api/db/worker-qr`, `/api/db/tickets` endpoints |
| [apps/web/next.config.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/next.config.ts) | LAN `allowedDevOrigins` (`192.168.1.8`, `192.168.1.*`) |
| [apps/web/package.json](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/package.json) | Added `qrcode`, `jsqr`, `@types/qrcode` |
| [package-lock.json](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/package-lock.json) | Updated npm lockfile for QR packages |
| [apps/web/src/app/globals.css](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/globals.css) | Global theme comment above `:root` |
| [apps/web/src/app/page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/page.tsx) | DB account/ticket sync, `?claim=` auto-claim, QR claim UI & camera decoder |

### New Files (18)

| File | Role in This Release |
|---|---|
| [apps/web/src/data/dbTypes.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/data/dbTypes.ts) | Shared TypeScript types for accounts, tickets, Worker QRs |
| [apps/web/src/lib/dbStore.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/lib/dbStore.ts) | Local JSON persistence store & server-side QR PNG generator |
| [apps/web/src/app/api/db/accounts/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/accounts/route.ts) | Accounts API route handler |
| [apps/web/src/app/api/db/tickets/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/tickets/route.ts) | Visitor tickets & QR claim API route handler |
| [apps/web/src/app/api/db/worker-qr/route.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/api/db/worker-qr/route.ts) | Worker QR issuance & listing API route handler |
| [apps/web/src/utils/qrTicketCodec.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/utils/qrTicketCodec.ts) | `qrcode` + `jsqr` encode/decode helpers and PNG card renderer |
| [apps/web/src/components/QrMatrixSvg.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/QrMatrixSvg.tsx) | Crisp SVG QR renderer backed by `qrcode` |
| [apps/web/src/app/worker/page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/worker/page.tsx) | Modularized Worker Staff Portal container (`/worker`) |
| [apps/web/src/components/worker/workerTypes.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/workerTypes.ts) | Worker tabs, bundling presets, attraction metadata helper |
| [apps/web/src/components/worker/WorkerSidebar.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerSidebar.tsx) | Worker sidebar navigation component |
| [apps/web/src/components/worker/WorkerTopBar.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerTopBar.tsx) | Worker header bar component |
| [apps/web/src/components/worker/WorkerBerandaView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerBerandaView.tsx) | Worker homepage KPI summary & quick shortcuts |
| [apps/web/src/components/worker/WorkerCreateQrForm.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerCreateQrForm.tsx) | POS receipt & bundling QR creation form |
| [apps/web/src/components/worker/WorkerQrResultView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerQrResultView.tsx) | Generated QR claim view with editable LAN origin |
| [apps/web/src/components/worker/WorkerQrListView.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerQrListView.tsx) | Issued Worker QR list component |
| [apps/web/src/components/worker/WorkerPrintQrModal.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/components/worker/WorkerPrintQrModal.tsx) | Printable Worker QR modal component |
| [docs/WORKER_AND_DB_DOCUMENTATION.md](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/docs/WORKER_AND_DB_DOCUMENTATION.md) | System docs + Worker & Superadmin build roadmap |
| [docs/BRANCH_CHANGES_Visitor_POC_0.md](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/docs/BRANCH_CHANGES_Visitor_POC_0.md) | This branch release summary |

---

## 4. Push & Teammate Onboarding Commands

### Push to `Visitor_POC_0`
```powershell
git add .
git status
git commit -m "feat(web,api): add account/ticket database, worker QR portal, and URL QR scanner"
git push -u origin Visitor_POC_0
```

### After Pulling on Another Machine (Mac / Windows)
Because `qrcode` and `jsqr` were added to [package.json](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/package.json), teammates pulling `Visitor_POC_0` must install dependencies before starting dev:
```bash
git pull origin Visitor_POC_0
npm install
npm run dev:web
```
