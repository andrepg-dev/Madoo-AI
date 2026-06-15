---
date: 2026-06-14
area: pricing (single source of truth for landing + app modal)
files:
  - packages/shared/src/pricing.ts
  - packages/shared/src/index.ts
  - apps/landing/package.json
  - apps/landing/components/PricingPlans.tsx
  - apps/client/components/shell/PricingDrawer.tsx
---

# Single-source pricing plans (landing + upgrade modal)

## Goal

Copy the landing's richer per-plan feature items into the in-app upgrade modal,
and make pricing one shared source consumed by both apps (monorepo coherence).

## Decision

Landing is canonical: marketing plans = **Basic / Medium / Pro** (no Free; the
product only offers a 7-day trial). The Stripe billing enum
(`Plan = FREE|STARTER|GROWTH`) is left untouched (it's wired to the DB enum,
price env vars and webhooks — renaming is a separate migration). Marketing plans
map to Stripe via `checkoutPlan`.

## Implementation

- New `packages/shared/src/pricing.ts` — `PRICING_PLANS` (basic/medium/pro with
  name, description, monthlyPrice 20/45/95, cta, featured, `checkoutPlan`, and
  the full feature list: monthly credits, stored templates, members, test emails
  a day, model access, exports, preview sharing) + helpers
  `getPlanDisplayPrice` / `getPlanYearlySavings` (yearly = 80%). Exported via
  shared index; dist rebuilt.
- Landing added `@madoo/shared` workspace dep; `PricingPlans.tsx` now consumes
  `PRICING_PLANS` + helpers (removed its local copy; same UI).
- `PricingDrawer.tsx` now renders `PRICING_PLANS`: 3 cards, no Free, full feature
  lists matching the landing, Popular badge, monthly/yearly toggle + savings.
  Checkout uses `plan.checkoutPlan`; "Current"/"Manage billing" via
  `checkoutPlan === currentPlan`.

## Known gap (billing follow-up)

Stripe only has STARTER/GROWTH, so `medium` and `pro` both map to `checkoutPlan:
"GROWTH"`. Until dedicated Medium/Pro Stripe prices exist:
- buying Medium or Pro both checkout GROWTH ($49),
- displayed yearly prices ($36/$76) won't match the actual charge,
- if on GROWTH, both Medium and Pro show "Current".
Fix later by extending the billing Plan enum + Stripe price envs.

## Verify

`tsc --noEmit` clean for apps/client and apps/landing; `@madoo/shared` builds.
