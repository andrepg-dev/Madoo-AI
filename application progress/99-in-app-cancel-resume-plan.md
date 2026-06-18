# 99 — In-app cancel / resume plan

## Goal
Let users cancel their paid plan directly in the app (not only via the Stripe
Customer Portal), and resume before the period ends.

## Behavior
Cancel sets `cancel_at_period_end = true` on the Stripe subscription: the user
keeps paid access until the current period ends, then Stripe's
`customer.subscription.deleted` webhook drops the plan back to FREE (already
handled by `applyStripeEvent` → `handleSubscriptionUpdated`). Resume flips it
back to `false`.

## Changes
- **shared/billing.ts** — `CancelSubscriptionResponseSchema`
  ({ cancelAtPeriodEnd, currentPeriodEnd }).
- **billing.service.ts** — `setCancellation(workspaceId, userId, cancel)`:
  owner-only, requires a `stripeSubscriptionId`, calls
  `stripe.subscriptions.update(..., { cancel_at_period_end })`, optimistically
  mirrors the flag locally (webhook reconciles).
- **billing.controller.ts** — `POST /billing/cancel`, `POST /billing/resume`.
- **client/actions/billing.ts** — `cancelSubscription()`, `resumeSubscription()`.
- **client BillingPanel** — on paid plans, a footer row: "Cancel plan" (ghost,
  with confirm) or "Resume plan" (when already canceling). Invalidates
  `billing-overview` so the "Cancels on <date>" line updates immediately.

## Notes
- In-app cancel uses the Stripe API directly, so it works regardless of Customer
  Portal config. The portal "Manage billing" button still exists too.
- Free users see no cancel button (nothing to cancel).

## Verification
- shared build + backend/client `tsc --noEmit` — all clean.
