---
date: 2026-05-05
area: backend / frontend / analytics
files: prisma schema, tracking module, webhooks module, analytics module, campaign-send processor, shared analytics, frontend AnalyticsScreen + CampaignsScreen
---

# 31 — Phase 4: tracking + analytics

Closes the loop the master plan opened: every send becomes data. Pixel
opens, click rewrite, Resend webhooks, on-demand aggregations, real
analytics UI.

## Backend

- **Schema** (`20260505120000_phase4_tracking_analytics`):
  - `Event { id, workspaceId, campaignId, contactId?, deliveryId?, type, data, createdAt }` with
    `EventType ∈ { DELIVERED, OPENED, CLICKED, BOUNCED, COMPLAINED, UNSUBSCRIBED }`.
    Indexes on `(campaignId, type, createdAt)`, `(workspaceId, type, createdAt)`,
    `(deliveryId, type)`.
  - `TrackedLink { id, workspaceId, campaignId, url, clicks, createdAt }` —
    indexed by `campaignId` and `(workspaceId, campaignId, clicks)`.
  - Migration applied with `prisma migrate deploy` (shadow-DB rebuild
    fails on the existing additive Phase-1 migration; deploying the
    hand-written SQL keeps the migration history clean without touching
    earlier migrations).

- **TrackingModule** (`src/tracking/`):
  - `GET /api/v1/t/o/:token.gif` → 1×1 transparent gif, no-store cache,
    HMAC-signed `{d: deliveryId}` token. Records `Event(OPENED)` and
    flips `CampaignDelivery.openedAt` (idempotent — only first open
    sets the timestamp).
  - `GET /api/v1/t/c/:token` → 302 redirect to the original URL after
    recording `Event(CLICKED)` and bumping `TrackedLink.clicks`.
    Tokens are HMAC of `{d: deliveryId, l: trackedLinkId}`.
  - Tokens use the same base64url + HMAC-SHA256 pattern as the
    existing unsubscribe token.

- **Send pipeline** (`campaign-send.processor.ts`):
  - Two-pass per chunk: (1) render every contact → compose with
    footer; (2) collect distinct trackable hrefs across the chunk,
    upsert `TrackedLink` rows, then (3) rewrite anchors and inject the
    pixel for each contact's HTML.
  - `<a href="…">` rewrite skips `mailto:`, `tel:`, fragments, and
    Mustache placeholders.
  - Pixel injected just before `</body>` (or appended if no body
    tag).
  - `TRACKING_URL` env (defaults to
    `http://localhost:${PORT}/api/v1`) is used for both pixel and
    redirect URLs so the same domain can serve them in prod.
  - The earlier `TODO(phase4)` comments are gone.

- **Resend webhook** (`POST /api/v1/webhooks/resend`):
  - Svix-style signature verification (svix-id, svix-timestamp,
    svix-signature). Rejects with 401 if `RESEND_WEBHOOK_SECRET` is
    set and the signature is invalid; logs a warning and accepts when
    secret is missing (for local development).
  - Maps `email.delivered`, `email.bounced`, `email.complained` to
    `Event` rows. Hard bounces and complaints suppress the contact
    (`SuppressionEntry`) and update `CampaignDelivery.status`.
  - Raw body verification requires `NestFactory.create(AppModule, {
      rawBody: true })`.

- **Unsubscribe**: `UnsubscribeService` now writes `Event(UNSUBSCRIBED)`
  and flips `CampaignDelivery.status=UNSUBSCRIBED` so analytics
  reflects unsubscribes immediately (the previous TODO note is
  resolved).

- **AnalyticsModule**:
  - `GET /api/v1/analytics/overview` → workspace totals + averages
    + last 10 sent campaigns with `openRate` / `clickRate`.
  - `GET /api/v1/analytics/campaigns/:campaignId` → `CampaignStatsDto`,
    cumulative-opens timeseries (buckets at 0/1/2/4/8/12/24/48/72/120/168h),
    `topLinks` (with unique-click counts), and `deliveryBreakdown`.
  - On-demand aggregation (`groupBy` per request) instead of the
    materialized view the master plan suggested. Volume isn't there
    yet; bring the view back when overview latency starts to slip.
  - Both endpoints behind `JwtAuthGuard + WorkspaceGuard`.

## Shared

- `packages/shared/src/analytics.ts` exports `EventTypeSchema`,
  `CampaignStatsSchema`, `CampaignAnalyticsSchema`,
  `WorkspaceOverviewSchema`, plus DTO types. Re-exported from the
  package index.

## Frontend

- `actions/analytics.ts` adds `analyticsApi.overview` /
  `analyticsApi.campaign(id)` plus query keys.
- `AnalyticsScreen` rewritten end-to-end. Real KPI cards (delivered,
  unique opens, unique clicks, unsubscribed), a campaign dropdown
  driven by `campaignsQuery.data`, the SVG opens-over-time chart fed
  by the API timeseries, "Top clicked links" sourced from
  `TrackedLink`, and a "Delivery breakdown" panel that replaces the
  email-client mock (Resend doesn't expose UA strings; user-agent
  parsing on pixel hits is a future-phase optimization). Recent
  campaigns table at the bottom doubles as a campaign picker.
- `CampaignsScreen` shows real `openRate` / `clickRate` per row
  (sourced from the workspace overview) and recipient counts. Sending
  a campaign now invalidates `analyticsKeys.all`.

## Verification

- Type-check: `pnpm exec tsc --noEmit` clean for backend, frontend, and
  shared.
- Backend build: `pnpm build` clean.
- Manual flow to run once a real campaign is sent:
  1. Send to a real inbox → load images → expect a row in `Event`
     with `type=OPENED` and `CampaignDelivery.openedAt` set.
  2. Click a link in the same email → expect a 302 to the original
     URL, an `Event(CLICKED)`, and `TrackedLink.clicks` incremented.
  3. Simulate Resend webhook with `curl` → bounce/complaint
     suppressions land in `SuppressionEntry`.

## Follow-up: workspace-wide "All campaigns" view

- `WorkspaceOverviewSchema` extended with `topLinks`, `deliveryBreakdown`,
  and `totals.totalRecipients`. Backend aggregates click counts across
  every campaign's `TrackedLink` rows (deduped by URL) and groups
  deliveries by status.
- `AnalyticsScreen` dropdown now ships with an "All campaigns" entry
  (default). KPI cards show workspace totals/averages, top links and
  delivery breakdown reuse the same panels, and the per-campaign
  opens-over-time chart is hidden with a hint to pick a campaign for
  the open curve.

## Skipped / deferred

- Materialized view `campaign_stats` + cron refresh (over-engineered
  for current volume; revisit when overview p95 slips).
- Email-client breakdown panel (would need UA parsing on pixel hits;
  not worth the bytes yet).
- `recharts` (kept the inline SVG chart for visual consistency with
  the rest of the app).
