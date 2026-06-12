# 52 - Billing Pricing Drawer

Date: 2026-06-11

## Work

- Wired client pricing drawer to `fetchBillingOverview`, `createCheckoutSession`, and `createPortalSession`.
- Replaced old Basic/Medium/Pro pricing with shared Free/Starter/Growth constants.
- Added current-plan badges, disabled Free/current-plan state, Stripe checkout redirects, and billing portal redirects.
- Yearly toggle now maps to backend `ANNUAL`; monthly maps to `MONTHLY`.

## Verification

- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`

## Notes

- No build commands run.
- Phase 5 billing drawer is complete at code level; Stripe-backed runtime smoke still needs configured backend env.
