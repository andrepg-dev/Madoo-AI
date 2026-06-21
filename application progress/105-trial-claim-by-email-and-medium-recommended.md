# 105 — Trial claim by email (FAQ) + Medium recommended

Follow-up to 104. Changes the opt-in trial UX and the recommended plan.

## Trial claim flow (new)
A visitor reserves a 7-day trial "spot" by email in the landing FAQ. On their
next login the claim is reconciled to their workspace; the pricing drawer then
offers the trial (and checkout grants it). The earlier ugly inline "Start 7-day
free trial" CTA shown to everyone is gone — it now appears only to eligible
(claimed) users, as the card's primary button.

### Data model
- New `TrialClaim { id, email @unique, createdAt }`.
- Migration `20260621010000_trial_claims` — applied to local dev.

### Shared (`packages/shared/src/billing.ts`) — dist rebuilt
- `BillingSubscriptionSchema` gains `trialClaimed` and `trialEligible`
  (`trialClaimed && !hasUsedTrial && !stripeSubscriptionId`).
- New `ClaimTrialEmailInputSchema` / `ClaimTrialEmailResponseSchema`.

### Backend
- `BillingService.recordTrialClaimEmail(email)` — idempotent upsert into
  `TrialClaim` (lowercased).
- New **public** `TrialClaimController` → `POST /v1/trial-claims { email }`
  (no auth; registered in `BillingModule`).
- `BillingService.getOverview` returns `trialClaimed` + `trialEligible`.
- `AuthService.issueSession` → `applyTrialClaim(email, workspaceId)`: if the
  email is in `TrialClaim`, upsert the workspace subscription with
  `trialClaimed = true`. Runs on every login (signup + returning). Best-effort,
  never blocks login. Done inline (Prisma) to avoid an Auth↔Billing cycle.

### Client (`apps/client/components/shell/PricingDrawer.tsx`)
- Trial CTA returns, gated on `subscription.trialEligible` and only for a plan
  the user isn't on. Single primary button labeled "Start 7-day free trial"
  (passes `claimTrial: true`) + caption "Free for 7 days, then $X/month". No
  second ghost button.
- **Recommended/featured = MEDIUM** (hardcoded), not `getRecommendedUpgradePlan`
  (removed that import here). "por los momentos."

### Landing
- `app/api/trial-claim/route.ts` — proxies `{ email }` to backend
  `POST /v1/trial-claims`.
- `components/PricingFaq.tsx` — the trial FAQ now renders a `TrialClaimForm`
  (email input + "Reserve my trial") posting to the route; trial answer rewritten
  to explain the reserve-then-see-it-at-pricing flow.

## Notes
- **Restart backend** to load the new controller.
- Backend / client / landing all typecheck clean; dev migration applied.
- Prod: apply `20260621010000_trial_claims` after review (with the 104 migration).
