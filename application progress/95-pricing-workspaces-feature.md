# 95 — Pricing: workspaces feature + drop model line

## Change (packages/shared/src/pricing.ts)
Each plan card gains a "workspaces" feature row and loses "Access to any model":
- Basic  → **5** workspaces
- Medium → **15** workspaces
- Pro    → **Unlimited** workspaces
- removed "Access to any model" from all three.

## Backend coherence (packages/shared/src/billing.ts)
`PLAN_LIMITS.workspaces` synced to the cards: STARTER 5, GROWTH 15, PRO -1.

## Notes
- Renderer (`FeatureText` in apps/client PricingDrawer + apps/landing
  PricingPlans) prints `value` bold + `label`, so "Unlimited workspaces" renders
  correctly. No renderer change needed.
- Workspace cap is displayed only; not yet enforced server-side (no quota check
  exists for workspace creation — out of scope here).
- Shared rebuilt to dist; no type breaks.
