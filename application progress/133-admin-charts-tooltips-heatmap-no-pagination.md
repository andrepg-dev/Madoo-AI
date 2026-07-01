# 133 — Admin: interactive charts everywhere, heatmap, plans, no pagination

Date: 2026-07-01

## Requests addressed
- Tooltips + visible axis numbers on **every** chart in the app.
- Removed the /users page description and the "Internal admin" eyebrow.
- Removed the sign-out button.
- Varied chart colors (no longer monotone).
- /emails table: no pagination — one scrollable list (sticky header).
- New **heatmap** of when emails are created (weekday × hour, UTC).
- **Plans** breakdown: paying vs free-trial vs free users.
- Clearer date labels: "Jun 26" on axes, "Thu, Jun 26" in tooltips.
- Removed the underline under the nav tabs.

## backend (`apps/backend/src/admin/admin-emails.service.ts`)
- List now returns everything (pageSize default 500, cap 1000) so the UI shows
  one scrollable list.
- Added `heatmap` (`EXTRACT(DOW/HOUR)` group-by over all emails) and `plans`
  (paying = active non-FREE plan; trial = TRIALING or `trialEndsAt` in future;
  free = users − paid − trial) to the response.
- shared: `AdminEmailHeatCell`, `AdminPlanBreakdown` on `AdminEmailList`.

## frontend (`apps/admin`)
- `components/charts-interactive.tsx`: `LineChart` now has y-axis value labels,
  optional area fill, sparse x-axis date labels, and a hover tooltip;
  `BarChart` shows a value on each bar + tooltip; new interactive `DonutChart`
  (hover highlight, center total, counted legend) and `Heatmap` (per-cell count
  + tooltip). Shared `CHART_COLORS` palette for variety.
- `/emails`: interactive volume line, status donut, **user-plans donut**, and
  the creation **heatmap**; pagination removed → scrollable list with sticky
  header; email thumbnails kept.
- `/users`: removed subtitle; charts use formatted dates + varied colors.
- `/` dashboard: activity chart → interactive line with tooltip + numbers.
- `components/shell.tsx`: dropped the "Internal admin" eyebrow and the sign-out
  button; nav tabs no longer underlined (`a { text-decoration: none }`).
- Deleted the old static `components/charts.tsx`.

## Deploy
Backend MANUAL on prod (adds heatmap/plans + unpaginated list); admin frontend
auto-deploys on Vercel from `main`.
