# 98 — Full per-feature plan limits + Billing settings section

## Goal
Make pricing unambiguous. Define and enforce every feature's limit (starting
with the free plan), mark "Export to any provider" as Coming soon on all plans,
and add a transparent Billing & usage section in user settings.

## Free plan (and all plans) limits
PLAN_LIMITS expanded from {ai, dailyAi, workspaces} to include storedTemplates,
members, workspaces, testEmailsPerDay:

| Plan | ai/mo | ai/day | templates | members(+owner) | workspaces | test emails/day |
|------|-------|--------|-----------|-----------------|------------|-----------------|
| FREE | 30 | 5 | 10 | 0 | 0 | 10 |
| STARTER | 100 | 15 | 50 | 2 | 5 | 50 |
| GROWTH | 250 | 25 | 150 | 3 | 15 | 100 |
| PRO | 550 | 50 | 300 | 5 | -1 | 300 |

Plus `PLAN_FEATURES` (same across plans for now): sharePreviewLinks, exportFormats
[HTML, JPEG, PDF], exportProviders = "coming_soon".

## Enforcement (no users yet — enforce everything)
- **AI credits** — already enforced (daily + monthly).
- **Stored templates** — `templates.service.saveFromVariant` blocks at the cap.
  Seed/starter templates (12 of them, > free cap) are excluded via
  `slug notIn SEED_TEMPLATE_SLUGS`, so the cap counts only user-saved templates.
- **Members** — `workspace-invites.service` guards a seat cap (owner + `members`)
  at invite creation (reserving pending invites) and again at accept (final guard
  for link invites).
- **Workspaces** — already enforced in `workspaces.service.createForUser`
  (signup's first workspace bypasses via `ensurePersonalWorkspace`). Fixed
  `PLAN_RANK` to include PRO.
- **Test emails/day** — allowance shown only; no DB tracking yet (per product call).

## Pricing cards
`PricingFeature` gained `comingSoon`. All 3 cards now list "Export to HTML, JPEG,
PDF" and show "Export to any provider of your choice" with a muted "Coming soon"
tag. Both renderers updated (landing PricingPlans + client PricingDrawer). Free is
intentionally not a card; its limits live only in the backend.

## Billing overview (backend)
`getOverview` now returns: usage {aiGenerations, dailyAiGenerations,
storedTemplates}, full `limits`, and `features`. New shared schemas:
ResourceUsage, PlanLimitsSchema, PlanFeaturesSchema.

## Settings → Account → "Billing & usage" (client)
New `components/settings/BillingPanel.tsx` + nav entry. Shows:
- Plan name + status badge + trial/renewal/cancel line.
- Usage meters: AI credits today, AI credits this month, stored templates
  (used / limit, remaining, reset date, bar turns red ≥90%).
- "What's included": members, workspaces, test emails/day, export formats,
  export providers (Coming soon), share preview links.
- Buttons: Upgrade/Change plan (opens PricingDrawer) and Manage billing (Stripe
  portal) when a Stripe customer exists.

## Verification
- shared build, backend/client/landing `tsc --noEmit` — all clean.
- backend unit tests — 11/11 pass (PLAN_LIMITS assertions updated to new shape).
- No DB migration for the limits (shared constants). The 3 earlier billing
  migrations (trial, PRO enum, creditsAnchor) were applied via `migrate deploy`.
- **Runtime check against the dev DB** (throwaway script booting the real
  TemplatesService / WorkspaceInvitesService / BillingService, then cleaned up):
  6/6 — FREE blocks the 11th template, any invite, and the 6th daily credit;
  STARTER allows all three. Real service code, real Prisma queries.

## Notes / follow-ups
- Test-email daily meter + enforcement needs a per-send counter (deferred).
- Billing panel shows the active workspace's plan/usage (billing is per-workspace).
