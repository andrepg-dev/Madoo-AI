# 131 — Admin: user retention page (comebacks) + Tailwind + charts

Date: 2026-07-01

## Goal
Show which users come back to Madoo and how often, explain what the numbers
mean in plain language, with clearer UI, its own page, and interactive charts
with tooltips. Introduce Tailwind into the admin app (the product's styling
standard). Also removed the dense "Recent users" table from the dashboard.

## What "returning / comeback" means
A user's **visit** = a distinct day they did something (signup day + any login
or product-activity day, from `ProductEvent`). **Returns** = visits − 1 (days
active *after* their first). A user is **returning** if they came back on ≥ 1
later day. This is what the page teaches and visualises.

## backend (`apps/backend/src/admin`)
- `admin-retention.service.ts` (`AdminRetentionService`) + `GET
  /admin/analytics/retention` on `AdminAnalyticsController`. Computes per-user
  visits/returns, aggregate totals (return rate, returning vs one-time, active
  7d/30d, avg visits), a returns-distribution histogram, a 30-day daily
  active-vs-returning series, and D1/D7/D30 cohort retention.
- shared: `AdminRetentionOverview`, `AdminRetentionUser`, `AdminReturnsBucket`,
  `AdminDailyActive` in `packages/shared/src/admin.ts`.

## frontend (`apps/admin`)
- **Tailwind v4** added: `@tailwindcss/postcss` + `tailwindcss` deps,
  `postcss.config.mjs`, and `globals.css` imports `tailwindcss/theme.css` +
  `utilities.css` (utilities only, **no preflight**, so the existing plain-CSS
  pages keep their look) plus a Madoo `@theme` palette.
- `components/charts-interactive.tsx`: hand-rolled client `LineChart` and
  `BarChart` with hover tooltips (no chart dependency).
- `app/users/page.tsx`: retention page (Tailwind) — KPI cards, daily
  active-vs-returning line chart, "how often users come back" bar chart, D1/D7/D30
  cohort bars, and a "Who comes back" table (visits / returns / last seen /
  status). Every section has a one-line plain-language explainer.
- `components/shell.tsx`: rebuilt in Tailwind — tab nav (Overview / Users /
  Emails) and the sign-out button replaced with a small muted icon.
- `app/page.tsx`: dropped the cluttered "Recent users" table (now on /users).

## Prod data cleanup
Per request, purged 6 test accounts (leonidponce417, andreponce144,
andreponce417, jaladaddin58, donay.9119, craptra@gmail.com) via a Prisma script
in the backend container: 6 users + 2 orphaned workspaces deleted, no shared
workspaces touched. Verified 0 remain (4 users left).

## Deploy
Backend MANUAL on prod (git pull + `docker compose up -d --build backend`).
Admin frontend auto-deploys on Vercel from `main`.
