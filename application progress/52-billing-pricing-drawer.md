# 52 - Billing Pricing Drawer

Date: 2026-06-11

## Work

- Wired `apps/client/components/shell/PricingDrawer.tsx` to real billing actions.
- Replaced hardcoded Basic/Medium/Pro copy and prices with shared Free/Basic/Medium/Pro plan constants:
  - `PLAN_DISPLAY_NAMES`
  - `PLAN_LIMITS`
  - `PLAN_PRICES`
  - `PLAN_PRICES_ANNUAL`
- Kept backend Stripe checkout and webhook behavior wired to shared plan constants.
- Added billing overview query to show current-plan state.
- Added checkout mutation:
  - monthly toggle sends `interval: "MONTHLY"`
  - yearly toggle sends `interval: "ANNUAL"`
  - successful checkout redirects to Stripe session URL
- Added portal mutation for current paid plans with Stripe customer data.
- Replaced placeholder "Checkout is not connected yet" toast with real checkout/portal error handling.

## Verification

- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`

## Notes

- Did not run build commands per repository instruction.
- Phase 5 remaining work: browser/runtime smoke with backend Stripe env configured, plus any settings billing route work if still desired.
