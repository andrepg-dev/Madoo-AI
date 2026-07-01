# 134 — Admin: exported-emails metric, favicon, bigger card text

Date: 2026-07-01

## Exported emails metric
Exports were not tracked at all, so there was no count. Added tracking + a
metric:
- `apps/backend/src/exports`: every export endpoint (html, image, pdf, esp,
  payload, gmail-draft, outlook-draft) now records an `email.exported`
  `ProductEvent` with `{ emailId, format }` via a best-effort
  `ExportsService.recordExport` (never fails the download).
- `admin-emails.service.ts`: added `exports { totalExports, emailsExported }`
  (total events + distinct emailIds) to the `/admin/emails` response.
- shared: `AdminExportStats` on `AdminEmailList`.
- /emails page: KPI row — Total emails, **Emails exported** (distinct + total),
  Ready, Paying users. NB: counts start now (no historical export data existed).

## Favicon
Copied Madoo `favicon.ico` + `icon.png` from `apps/landing/app` into
`apps/admin/app` so Next serves the Madoo icon in the browser tab.

## Text sizes
Per feedback, stopped using `text-xs` on cards. Bumped card descriptions, KPI
hints, chart legends, tooltips, bar value/label text, and axis/weekday labels to
`text-sm` (or `text-xs` for axis only). `text-xs` now reserved for special cases
(status badges, uppercase micro-eyebrows, dense heatmap cell numbers).

## Deploy
Backend MANUAL on prod (export tracking + export stats); admin auto-deploys on
Vercel from `main`.
