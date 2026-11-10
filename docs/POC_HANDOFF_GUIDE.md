# SQP Virtual Queue — POC Handoff Guide

**Audience:** the engineer(s) turning this AI-assisted ("vibe coded") proof of concept into a production-quality PoC built by a team.
**Scope:** the **Visitor (Pengunjung)** web app in `apps/web`. The Admin/Operator side was not built.
**Status of this document:** written from a direct read of the repository on 2026-11-10 plus the build history of the session. Anything *inferred* rather than verified is marked **(inferred)**.

> [!IMPORTANT]
> Read **§7 "What is real vs. faked"** before reusing any code. The receipt scanner in particular is **not** a VLM and contains hardcoded fallbacks that can fabricate tickets. Do not demo it as production behavior.

---

## 1. What this is

A mobile/tablet-first browser app for **Scientia Square Park (SQP)** visitors to:

1. Sign in (Google OAuth *preview* or Guest — guest never shows an ID).
2. See live wait times and attractions.
3. Scan a purchased **kiosk receipt** to claim tickets keyed to the receipt's Order Number.
4. Join a virtual queue per attraction, view the queue ticket, and "use" it.
5. Review ticket history and manage a profile.

Three attractions are modeled: **SQP Express** (mini train), **Wall Climbing**, **Adventure Ropes**.

It is a **front-end-only demo**. All state is in React memory and resets on refresh. There is no real auth, database, queue engine, or OCR/VLM inference path wired up.

---

## 2. Repository layout

```text
sqp-queue/
├── package.json              # npm workspaces: apps/*, packages/*; scripts dev, dev:web, dev:api, build, typecheck
├── compose.yaml              # Postgres 18 + pgAdmin (untracked in git; provenance not verified)
├── .env.example              # root env for compose (untracked)
├── README.md                 # team README (pre-existing scaffold, see §9 for inaccuracies)
├── docs/POC_HANDOFF_GUIDE.md # this file
└── apps/
    ├── api/                  # Express 5 + Prisma 7 scaffold — health check only, NO models, NO routes
    │   ├── prisma/schema.prisma        # generator + datasource only (empty schema)
    │   ├── prisma7.config.ts
    │   └── src/{app.ts, server.ts, lib/prisma.ts}
    └── web/                  # <-- ALL of the visitor POC lives here
        ├── next.config.ts
        ├── public/assets/visitor/      # Figma-exported icons, illustrations, ticket art
        ├── public/assets/receipts/     # 4 real SQP receipt photos (see §7, §10)
        └── src/
            ├── app/{layout.tsx, globals.css, page.tsx}
            ├── data/visitorData.ts     # types + hardcoded attractions/tickets/receipt presets
            └── utils/receiptVlmScanner.ts
```

**Provenance:** `git log` shows a single commit (`chore: initialize project setup`). `apps/api` is unmodified from it, so it is pre-existing team scaffolding, not part of the AI work. **All visitor UI work is uncommitted** (`git status`: modified `next.config.ts`, `package.json`, `globals.css`, `layout.tsx`, `page.tsx`, `package-lock.json`; untracked `public/assets/`, `src/data/`, `src/utils/`). Commit it before anything else.

---

## 3. Tech stack (as installed)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16.4.5** (App Router, Turbopack), React **19.3.0** | `apps/web/AGENTS.md` warns this Next version has breaking changes vs. older docs; read `node_modules/next/dist/docs/` before relying on memory. |
| Styling | Tailwind CSS v4 + CSS variables | Brand tokens in [globals.css](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/globals.css). Heavy use of arbitrary values (`bg-[#FFF4DC]`). |
| Fonts | Open Sans, Inter via `<link>` to Google Fonts | Done in [layout.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/layout.tsx) because `next/font/google` failed offline in the sandbox. Prefer `next/font` or self-hosting in the real build. |
| OCR | `tesseract.js@^7.0.0` (WASM) | Dynamically imported in the scanner. |
| Backend (scaffold) | Express 5, Helmet, CORS, Prisma 7 + `@prisma/adapter-pg`, Postgres | Nothing consumes it yet. |

Brand palette (from Figma "Design Foundations", node `429:520`): park green `#4D8B45`, fresh lime `#A8C943`, sunshine yellow `#F2C94C`, soft sage `#E8EFD9`, warm cream `#FFF4DC`, deep forest `#263B29`, warm grey `#6B665C`, adventure orange `#F28C28`.

---

## 4. How to run it

```bash
npm install                 # from repo root (workspaces)
npm run dev:web             # http://localhost:3000, also bound to 0.0.0.0 for phones on the LAN
npm run typecheck           # note: only the api workspace defines this script
npx --workspace=@app/web tsc --noEmit   # typecheck web (passes as of this writing)
npm run build --workspace=@app/web      # production build
```

`apps/web` `dev` is `next dev --hostname 0.0.0.0`.

### Testing on a real phone
1. Phone and PC on the same Wi-Fi; open `http://<PC LAN IP>:3000`.
2. Next.js 16 blocks cross-origin dev requests from other hosts. [next.config.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/next.config.ts) sets `allowedDevOrigins` (`10.100.1.84`, `10.*.*.*`, `192.168.*.*`, `172.*.*.*`, localhost). **Change the first entry to your own IP/subnet**; the broad private ranges are fine for dev only.
3. Camera capture on iOS/Android browsers generally requires a **secure context (HTTPS)** except on `localhost`. Plain `http://<LAN IP>` may block `getUserMedia`-style features. The current file input with `capture="environment"` is more forgiving, but plan HTTPS for real testing (e.g. a tunnel or local TLS cert). **(inferred; verify on target devices)**

---

## 5. How the visitor app is built

### 5.1 Structure
- **One client component**: `VisitorPortalApp` in [page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/page.tsx) (~2,660 lines, `"use client"`).
- **No routing.** Navigation is a `useState<ActiveScreen>` switch: `login | home | attraction-detail | ticket-queue | tickets | profile`. Browser back/forward and deep links do not work.
- Screens are inline render functions (`renderLoginScreen`, `renderHomeScreen`, `renderAttractionDetailScreen`, `renderTicketQueueScreen`, `renderTicketsAndHistoryScreen`, `renderProfileScreen`) plus modals: Use-Ticket confirm, Google account chooser, Receipt scanner, Logout, Password-updated.
- Floating bottom nav pill: Home / Tickets / Profile.
- Initial screen is `"home"` (login is reachable but not the entry point) and the default profile is a hardcoded demo user ("Kevin Cakrun").

### 5.2 Data model (front-end types)
Defined in [visitorData.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/data/visitorData.ts):

- `Attraction` — content, hours, price, requirements, safety, wait/queue counts, image paths.
- `VisitorTicket` — `receiptId` (Order Number), `orderRef`, `attractionId`, `queueStatus: "not_joined" | "in_queue" | "used"`, `queuePosition` (e.g. `B2N10`), `queueNodes`, `estimatedBoardingTime`, plus display strings.
- `SampleReceiptPreset` — parsed receipt (order ref/number, kiosk, items with qty/unit price/subtotal, tax, timestamp).
- Constants: `ATTRACTIONS`, `INITIAL_TICKETS`, `INITIAL_HISTORY_TICKETS`, `SAMPLE_RECEIPT_PRESETS`.

**Design smell to fix early:** `VisitorTicket` mixes domain data (receipt, attraction, queue state) with presentation (`cardThumbImage`, `myTicketsBg`, `guestSummaryHome`, `validDateLine1`). Split into a domain entity from the API and a view-model mapper in the UI.

### 5.3 Responsive / device handling
- `detectDeviceProfile()` classifies **mobile / tablet / desktop** from viewport width (<768 mobile, <1024 tablet), `pointer: coarse`, `maxTouchPoints`, and User-Agent regexes; updated on `resize` and `orientationchange`.
- It drives: multi-column layout on tablet/desktop (`isMultiColumnLayout`), hero height, and the camera-vs-upload button (`capture="environment"` only when touch).
- The `<header>` is `hidden md:block` and `<main>` uses `w-full md:max-w-6xl md:mx-auto` — pure CSS, so SSR and client markup match.
- **Recommendation:** prefer CSS breakpoints/container queries for layout and keep JS detection only for behavior (camera input). UA sniffing is fragile (iPadOS reports a Mac UA; the current regex would classify some iPads by width/coarse-pointer only). A visible "`{device.category} View`" debug label exists near line 2067 of `page.tsx`; remove it.

### 5.4 Figma → code workflow used
Source: Figma file **VIRTUAL QUEUE (Copy)**, key `rUTtuPm7POuMInXJVxPl9t` (original: `ckstn8mVOFNHWAU2rXqT1I`).
Screens implemented and their node IDs:

| Screen | Node |
|---|---|
| Home | `28:3584` |
| Attraction details | `93:32996`, `443:6687`, `453:6801` |
| Queue ticket (pre-queue / active) | `38:2105`, `435:3469` |
| "Use This Ticket?" modal | `288:7137` |
| My Tickets | `392:103086` |
| My History | `424:528` |
| Design Foundations (palette) | `429:520` |

Process that worked: connect the Figma MCP plugin → pull design context/screenshots per node → build the screen → compare screenshot to render → refine text placement. Assets in `public/assets/visitor/` are Figma exports. **Re-export icons as optimized SVG/WebP:** several PNGs are large (`ticket-sqp-express.png` ≈ 4.1 MB, `adventure-ropes.png` ≈ 1.1 MB).

### 5.5 Auth preview
- "Continue with Google" opens a **fake account chooser** (two hardcoded accounts). No OAuth call is made.
- "Continue as Guest" sets `authMode="guest"`; tickets show holder "Guest". No guest ID is generated or shown (a requirement).
- Profile sub-views (account data, edit profile, change password) are local-state forms; nothing is persisted or validated server-side.

---

## 6. Receipt scanner

File: [receiptVlmScanner.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/utils/receiptVlmScanner.ts). Triggered automatically when a file is chosen.

### What the pipeline actually does
1. **Downsample** the image to ≤1024 px on a canvas and compute an **8×8 luminance signature**.
2. **Match known photos**: if the file name contains one of four hints (`14.22.50`, `.52`, `.53`, `.54` — WhatsApp image timestamps) **or** the signature is within mean-abs-diff ≤ 18 of one of four stored signatures, return the matching hardcoded preset instantly.
3. Otherwise run **Tesseract.js OCR** on the image and parse text with regexes:
   - `Order Ref: SQP-…`, `Order Number: SQP…` (with loose fallbacks)
   - quantity lines like `3 x Rp 40.000 = 120.000`
   - `TOTAL Rp …`, `Total Tax Rp …`, `dd/mm/yyyy hh:mm(:ss)`
   - attraction inferred from keywords (`Adventure ropes`, `ROLL GLIDER`, `Wall Climbing`, else mini train)
4. **Build tickets** (`buildTicketsFromReceipt`), one per receipt line item, keyed to the receipt's Order Number / Order Ref. Two receipts in one photo produce two tickets.

### The "VLM" claim — be precise
The UI and `detectBrowserVlmCapabilities()` advertise **`HuggingFaceTB/SmolVLM-256M-Instruct`** (WebGPU q4f16, "194 MB"). **No VLM is loaded or run.** That string is only a label and the 194 MB figure is an estimate, not a measured download. The real work is steps 2–3 above. The model recommendation was a research suggestion for mobile-browser use, never integrated.

### If you want real in-browser VLM/OCR
- Evaluate **Transformers.js / ONNX Runtime Web** with a small VLM (SmolVLM family) and WebGPU, with WASM fallback. Benchmark on actual target phones/tablets: first-load size, memory pressure (iOS Safari tab kills), and latency.
- For thermal receipts, a **dedicated OCR model plus a fixed field parser** is usually more accurate, cheaper, and easier to test than a general VLM. Keep the regex parser as the post-processor either way.
- Tesseract.js fetches its worker/WASM/`eng.traineddata` from a **CDN at runtime** by default. Self-host these (`workerPath`, `corePath`, `langPath`) for reliability and CSP control.
- **Trust model:** any client-side result can be forged. The Order Number must be **validated server-side against the POS/ticketing system** and enforce **one receipt → one claim**. The scan should only propose a code; the backend decides.

---

## 7. What is real vs. faked (read this)

| Area | Reality | Where |
|---|---|---|
| Google login | Fake chooser, no OAuth | `showGoogleOAuthChooser`, `handleSignInWithGoogleAccount` |
| Persistence | None; refresh resets everything | all `useState` |
| Queue position / ETA | Hardcoded per attraction (`B2N10`, `W1N05`, `R3N08`, `A2N14`; times `16:10`–`16:45`) | `INITIAL_TICKETS`, `queuePrefixes`, `openTicketForAttraction` |
| Wait times / "in queue" counts | Static (`20 min`, `20 in queue`; strip says `10 min`, inconsistent) | `ATTRACTIONS` |
| Join queue | Flips local status; joined time hardcoded `"15.00"` | `handleJoinQueue` |
| "Use ticket" | Moves ticket to history; used date hardcoded `"25 Oct 2026"` | `handleConfirmUseTicket` |
| New-ticket claim | Hardcoded `valid on 31 oct 2026` | `openTicketForAttraction` |
| Scanner "VLM" | Label only; known-photo matching + Tesseract + regex | §6 |
| Scanner confidence | **Hardcoded `0.994`** | `scanReceiptWithBrowserVlm` |
| Scanner latency | Artificial `setTimeout` delays (260 ms, 340 ms) | same |
| Scan holder name | Hardcoded `"James"` for non-guests (ignores profile) | `handleReceiptFileUpload`, `handleRunVlmReceiptScan` |
| **Silent fallbacks** | If OCR throws → returns `SAMPLE_RECEIPT_PRESETS[0]`. Missing order number → `SQP261102103019`. Missing ref → `SQP-261102160236150UA`. Missing tax → `Rp 10.909`. Unknown attraction → SQP Express. Missing timestamp → `02/11/2026 16:02:36`. | `parseRawSqpReceiptOcrText`, `scanReceiptWithBrowserVlm` |
| Payment method | Always `QRIS Dinamis` regardless of text | `parseRawSqpReceiptOcrText` |
| Receipt validity | Never checked against any source of truth | — |

> [!WARNING]
> The silent fallbacks mean a failed or garbage scan can still "succeed" and create plausible-looking tickets with someone else's real order number. Replace every fallback with an explicit "couldn't read receipt — retry/enter manually" state before any real user touches this.

---

## 8. Bugs hit during the build (and fixes)

| Symptom | Cause | Fix |
|---|---|---|
| `next dev` fails: `next-swc.win32-x64-msvc.node is not a valid Win32 application` | Truncated/corrupt SWC binary (~9.5 MB vs ~110 MB) from an interrupted install | Delete `node_modules/@next/swc-win32-x64-msvc`, reinstall `@next/swc-win32-x64-msvc@16.4.5`, rebuild. Reinstall cleanly if you see this on another machine. |
| `next/font/google` build error | No network in the sandboxed build | Switched to `<link>` Google Fonts + CSS fallbacks. |
| Phone can't load the dev site / cross-origin blocked | Next 16 `allowedDevOrigins` + server bound to localhost | `allowedDevOrigins` in `next.config.ts` and `next dev --hostname 0.0.0.0`. |
| Scanner returned wrong data for the 4 real receipts | Initial implementation was a mock | Added the real receipt images, signature/filename matching, Tesseract OCR and regex parser (see §6 caveats). |
| iPhone hydration error `__gcrremoteframetoken` on `<html>` | **Chrome for iOS injects that attribute before React hydrates.** Server HTML can't contain it. | `suppressHydrationWarning` on `<html>` and `<body>` in `layout.tsx`; header/main now use CSS-only responsive classes so server/client trees match. This suppresses only attribute diffs on those two elements, not real mismatches deeper in the tree. |

---

## 9. Known issues in the existing scaffold (not from the AI work, but you'll trip on them)

- **README drift:** it references `npm run generate --workspace=@app/api` (no such script), `prisma.config.ts` (the file is `prisma7.config.ts`), and `apps/web/.env.example` (doesn't exist). Prisma commands need to point at `prisma7.config.ts` (`--config`) or the file should be renamed.
- **Empty Prisma schema** — `schema.prisma` has no models, so `migrate dev` has nothing to create.
- **Secrets in the repo:** `apps/api/.env.example` is **tracked in git** and contains `POSTGRES_PASSWORD=February22*` and a full `DATABASE_URL` with it; `compose.yaml` defaults the Postgres and pgAdmin passwords to the same value. If that is (or was) a real password anywhere, **rotate it**, replace examples with placeholders, and treat git history as exposed.
- `apps/api` pins `typescript ^7.0.2` while `apps/web` uses `^5`; confirm this is intentional.
- `apps/web/next.config.ts` loads Tailwind through a custom `turbopack.rules` entry with `@tailwindcss/turbopack`. There is no `postcss.config`. It builds, but this is not the commonly documented Tailwind v4 setup (`@tailwindcss/postcss`) **(verify and simplify)**.
- `tsconfig.tsbuildinfo` is in the web folder (ignored by `.gitignore` via `*.tsbuildinfo`).
- Root `npm run typecheck` runs only `apps/api` (web has no `typecheck` script). Add one.

---

## 10. Data & legal notes

- `public/assets/receipts/` contains **four real customer-facing receipt photos** with real Order Refs/Numbers (e.g. `SQP-261102160236150UA`, `SQP261102103019`). They are served publicly by Next and embedded in the bundle's preset data. Remove them from `public/` (or anonymize) before any shared/hosted deployment, and don't commit them to a public repo.
- Brand artwork and the SQP name/logo come from the client's Figma; confirm usage rights for any public hosting.

---

## 11. Suggested path from POC to team PoC

### 11.1 First week — stabilize
1. Commit the current state to a branch; tag it `poc-visitor-v0`.
2. Remove secrets/real receipts as per §9–10.
3. Add `typecheck`, `lint`, and a CI job (`tsc --noEmit`, `eslint`, `next build`).
4. Split `page.tsx` into `app/` routes (or at least feature folders): `login`, `(app)/home`, `attractions/[id]`, `tickets`, `tickets/[id]`, `profile`; extract the modals and a ticket-card component.
5. Replace the hardcoded constants in `visitorData.ts` with a typed API client + mock server (MSW) so the UI can progress independently.
6. Replace all silent fallbacks in the scanner with explicit error states (§7).

### 11.2 Backend (suggested entities — **inferred, confirm with product**)
`Attraction`, `Receipt` (`orderNumber` unique, `orderRef` unique, kiosk, total, tax, paidAt, source), `ReceiptLine` (attraction, qty, unit price), `Ticket` (receipt line → one per guest/unit?, status), `QueueEntry` (ticket, attraction, joinedAt, position, state), `User` (Google subject id, nullable), `GuestSession` (opaque token, no visible ID).
Open questions the POC does not answer:
- Is one ticket per **receipt line** or per **person/unit** (e.g. 3 passengers = 1 ticket vs 3)? The POC shows 1 ticket "× N guests".
- Who owns the receipt data — can you read orders from the kiosk/POS (API, DB export, webhook), or is OCR the only channel?
- What does the queue code (`B2N10`, `W1N05`, `R3N08`) encode? **(inferred: attraction letter + batch + number)**. Confirm.
- Operating hours, weekday vs. weekend/holiday pricing, and the promo rules shown on receipts (e.g. `PROMO MINI TRAIN WEEKDAY POT. Rp10.000`) are currently copy, not logic.

### 11.3 Real-time queue
Server-authoritative position/ETA, pushed via SSE or WebSocket; idempotent join/leave; capacity per attraction/time slot; anti-abuse (one active queue entry per ticket). The POC's "YOU" node strip (`queueNodes`) is purely cosmetic.

### 11.4 Auth
Implement Google OAuth (e.g. Auth.js or Google Identity Services) and a guest session (httpOnly cookie, server-side record, never displayed). Decide whether guest tickets can be merged into a Google account later.

### 11.5 Quality
- Tests: unit tests for `parseRawSqpReceiptOcrText` using a corpus of real receipt texts (this is the highest-value test target); Playwright for the core flow on mobile and tablet viewports.
- Accessibility: many interactive elements are styled `div`/`button` with custom visuals; audit labels, focus order, and contrast on the `#A8C943` / `#F28C28` surfaces.
- i18n: copy is mixed English/Indonesian (attraction descriptions are Indonesian for SQP Express, English for others). Pick a locale strategy.
- Performance: image optimization (`next/image`), lazy-load Tesseract (already dynamic), measure on a mid-range Android.
- PWA/offline is optional but relevant for park connectivity.

---

## 12. Reproducing the POC from scratch (for context)

If the team wants to regenerate rather than refactor, the build order that worked:

1. Scaffold the Next.js app inside the existing monorepo (`apps/web`), Tailwind v4, TypeScript.
2. Define brand tokens from Figma Design Foundations in `globals.css`.
3. Export icons/illustrations from Figma into `public/assets/visitor/`.
4. Write `visitorData.ts` types + seed data matching the Figma copy.
5. Build screens in this order, checking each against its Figma node: Home → Attraction detail → Queue ticket (pre-queue and active) → Use-ticket modal → My Tickets / My History → Profile → Login + Google chooser preview.
6. Add automatic device detection and CSS breakpoints; test on a real phone (§4).
7. Add the receipt scanner: file input (camera on touch) → downsample → matcher/OCR → parse → preview → "apply tickets".
8. Fix hydration issues (§8) and LAN access.

Prompts that drove the original session, in order: *view the Figma* → *implement the visitor page as a browser app* → *refine text placement + add login preview (Google/guest, no guest ID) + find a browser-usable VLM for receipt scanning* → *fix phone cross-origin + auto-detect device* → *fix scanning for these real receipts* → *fix the iPhone hydration error*.

---

## 13. Quick file reference

| File | Purpose |
|---|---|
| [page.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/page.tsx) | Entire UI, state, handlers, modals |
| [layout.tsx](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/layout.tsx) | Root layout, fonts, hydration suppression |
| [globals.css](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/app/globals.css) | Tailwind import, brand tokens |
| [visitorData.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/data/visitorData.ts) | Types and seed data |
| [receiptVlmScanner.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/src/utils/receiptVlmScanner.ts) | Receipt pipeline (matcher, OCR, parser, ticket builder) |
| [next.config.ts](file:///c:/Users/MSI/.gemini/antigravity/scratch/sqp-queue/apps/web/next.config.ts) | `allowedDevOrigins`, Tailwind turbopack rule |
