# 135 — Admin: live online-users widget + chart hover-dot fix

Date: 2026-07-01

## Real-time online users
Near-real-time presence without websockets:
- backend `AdminAnalyticsService.live()` + `GET /admin/analytics/live`: distinct
  users with any activity `ProductEvent` in the last 5 / 15 / 60 minutes, plus
  the 12 most-recently-seen users. shared: `AdminLive` / `AdminLiveUser`.
- admin `app/api/live/route.ts` (force-dynamic) proxies to the backend using the
  admin cookie so the browser can poll it; `components/live-users.tsx` (client)
  polls every 10 s and shows a pulsing "N online now" pill.
- The pill lives in the `Shell` header, so it shows on every admin page and
  refreshes live.

"Online" = active in the last 5 minutes (driven by `auth.session_active` and the
other activity events).

## Chart hover-dot fix
The line charts use `preserveAspectRatio="none"`, which x-stretches the SVG and
therefore squashed the `<circle>` hover markers into distorted ovals. Replaced
them with HTML dots (absolutely positioned, `left: %`, `top: px`) so they stay
perfectly round regardless of the horizontal scale.

## Deploy
Backend MANUAL on prod (adds /admin/analytics/live); admin auto-deploys on
Vercel from `main`.
