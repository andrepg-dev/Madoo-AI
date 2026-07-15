# 101 - Pricing cards: add daily credit equivalent

Date: 2026-07-14

## What changed
- `packages/shared/src/pricing.ts`: each `PRICING_PLANS` entry now has a
  "credits a day" row right after "monthly credits" (monthly credits ÷ 30,
  rounded, shown as `~N`):
  - Basic: 100 monthly → ~3/day
  - Medium: 250 monthly → ~8/day
  - Pro: 550 monthly → ~18/day
- Rebuilt `@madoo/shared` dist so `PricingPlans` (landing) and
  `PricingDrawer` (in-app upgrade modal) both pick up the new row —
  both consume `PRICING_PLANS` from the shared package.

## Files
- `packages/shared/src/pricing.ts`
