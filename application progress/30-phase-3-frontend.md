---
date: 2026-05-02
area: frontend / campaigns
files: campaigns actions, audit-log actions, ComposeModal, CampaignsScreen, settings, AnalyticsScreen
---

# 30 — Phase 3 frontend: real campaigns

Implemented `actions/campaigns.ts` and `actions/audit-log.ts` (read-only). Campaigns UI loads real data; Compose modal final step exposes Test / Send now with postal gating + link to `/settings`. Added minimal `/settings` page for postal address. Removed `MOCK_CAMPAIGNS` from `lib/data.ts`. Backend lists audit rows at `GET /audit-logs`.
