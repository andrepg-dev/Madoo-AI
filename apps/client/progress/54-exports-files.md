# 54 — Phase 7A: File exports (HTML / PNG / JPEG / PDF)

Date: 2026-06-11

## Goal

Make the export modal's **File** tab functional: download HTML, raster image,
and PDF for the active email variant. AMPHTML stays a "coming soon" stub.

## Shared (`packages/shared/src`)

- New `exports.ts`:
  - `ExportFileFormatSchema` (`html|png|jpeg|pdf|amphtml`).
  - `ExportImageFormatSchema` (`png|jpeg`).
  - `EspProviderSchema` (11 ESP slugs) + `ExportPayloadDtoSchema` (used by 7B).
- Exported from `index.ts`.

## Backend

- `generation/screenshot.service.ts`:
  - `screenshotHtml(html, { type, quality })` — `type` now selects `png` or
    `jpeg` (quality applied for jpeg). Default still png.
  - New `pdfFromHtml(html)` — Puppeteer `page.pdf({ format: "A4",
    printBackground: true })` with margins.
- New `src/exports/` module (`@UseGuards(JwtAuthGuard, WorkspaceGuard)`):
  - `ExportsService.resolveVariant(emailId, workspaceId, variantId?)` resolves a
    specific or latest variant scoped to the workspace.
  - `exportHtml` → `juice`-inlined CSS → attachment.
  - `exportImage(format)` → screenshot buffer.
  - `exportPdf` → pdf buffer.
  - `ExportsController` routes on `emails`:
    - `GET :id/export/html?variantId=`
    - `GET :id/export/image?variantId=&format=png|jpeg`
    - `GET :id/export/pdf?variantId=`
    - `GET :id/export/amphtml` → `501 Not Implemented`.
  - `sendAttachment` sets `Content-Type` + `Content-Disposition: attachment`.
- `juice@^11` added to `apps/backend/package.json`; `pnpm install` run.
- Registered `ExportsModule` in `app.module.ts`.

## Client

- New `app/api/export/[...path]/route.ts` — authenticated GET download proxy:
  cookie → Bearer + `x-workspace-id`, streams upstream body and passes through
  `Content-Type` / `Content-Disposition`.
- `app/email-template-project/page.tsx` — `ExportProviderModal` now takes
  `emailId` / `variantId`. File cards trigger anchor downloads via the proxy;
  AMPHTML card disabled with "Coming soon"; guards with a toast when no email
  exists yet.

## Verification

- `tsc` clean for `packages/shared`, `apps/backend`, `apps/client`.
- Runtime smoke pending live servers: open a ready email → File tab → HTML/Image/PDF download.
