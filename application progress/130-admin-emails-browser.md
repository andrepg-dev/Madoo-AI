# 130 — Admin: emails browser (render + chat history + charts)

Date: 2026-07-01

## Goal
In the admin panel, let an admin browse every generated email, render it, read
the chat history that produced it, and see the data as charts — styled per
`design.md`.

## shared (`packages/shared/src/admin.ts`)
New schemas: `AdminEmailListItem`, `AdminEmailList` (items + total + page +
`statusBreakdown` + `dailyVolume`), `AdminEmailVariant`, `AdminEmailChatMessage`,
`AdminEmailRun`, `AdminEmailDetail`. Rebuilt `@madoo/shared`.

## backend (`apps/backend/src/admin`)
New `AdminEmailsController` + `AdminEmailsService` (registered in
`AdminAnalyticsModule`, guarded by `JwtAuthGuard` + `AdminGuard`):
- `GET /admin/emails?page&pageSize&search` — paginated list with user,
  workspace, variant/chat counts, latest subject; plus a status `groupBy` for
  the donut and a 14-day `date_trunc` volume series for the area chart.
- `GET /admin/emails/:id` — full detail: email meta, all variants
  (`compiledHtml` for rendering), chat messages, and generation runs.

## frontend (`apps/admin`)
- `actions/emails.ts`: `fetchEmails`, `fetchEmailDetail` via `adminFetch`.
- `components/charts.tsx`: dependency-free inline-SVG `AreaChart`, `DonutChart`,
  `ChartLegend` (server-rendered).
- `components/shell.tsx`: shared shell + top nav (Dashboard / Emails); dashboard
  refactored onto it. `app/page.tsx` daily-motion bars → `AreaChart`.
- `app/emails/page.tsx`: search + status donut + volume area chart + table with
  row links + pager.
- `app/emails/[id]/page.tsx`: rendered email (sandboxed `<iframe srcDoc>` via
  client `components/email-render.tsx` with variant switching), meta, prompt,
  chat history (TEXT turns + attachments + feedback), generation-runs table.

## design.md alignment
Admin uses its own lightweight global CSS (no Tailwind/design-system). Aligned
it to the Madoo palette (`#f3f4f6` page bg, ink/muted/paper) and replaced hard
1px card borders with paper-border **shadow rings**
(`0 0 0 0.5px rgb(... / 0.12)`), no elevation shadows — matching design.md
intent within the admin's stack.

## Deploy
Backend is MANUAL on prod (git pull + `docker compose up -d --build backend`).
Admin frontend auto-deploys on Vercel from `main`.
