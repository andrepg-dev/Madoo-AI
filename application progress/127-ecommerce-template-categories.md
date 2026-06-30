# 127 — E-commerce template categories

Date: 2026-06-30

## Goal
Add more email-template categories, focused on e-commerce, sourced from how
Klaviyo, Stripo, and Really Good Emails organize their template/flow libraries.

## Research (what the platforms expose)
- **Klaviyo** flows: Abandoned Cart, Browse Abandonment, Post-Purchase, Win-back
  (≈ Re-engagement), Back in Stock, Price Drop, Welcome.
- **Really Good Emails** categories: Order Confirmation, Receipt / Payment,
  Shipping, Confirmation, Review request, plus general E-commerce.
- **Stripo** categories: E-commerce, Loyalty, Birthday, Promo, Newsletter,
  Seasonal, Welcome, Abandoned cart, Retargeting.

## Change
Single source of truth is `COMMUNITY_TEMPLATE_CATEGORIES` in
`packages/shared/src/emails.ts` (consumed by client + backend).

Added 12 new e-commerce categories (skipped ones already covered — Abandoned
Cart, Re-engagement, Referral, Promotional, Confirmation, Transactional,
Seasonal / Holiday, Survey & Feedback):

Order Confirmation, Shipping & Delivery, Receipt / Invoice, Back in Stock,
Price Drop, Browse Abandonment, Post-Purchase, Cross-sell / Upsell,
Loyalty & Rewards, Birthday & Anniversary, Sale / Flash Sale, Review Request.

## Files
- `packages/shared/src/emails.ts` — extended `COMMUNITY_TEMPLATE_CATEGORIES`
  enum (new items inserted before `"Other"`).
- `apps/client/components/home/project-show-case.tsx` — added regex
  `categorySuggestionRules` for each new category so publish-to-community
  auto-suggests them (specific e-commerce rules placed before generic
  Transactional / Promotional rules so they win the match).
- Rebuilt `@madoo/shared` (`npm run build` → dist) so new enum values resolve.

## Notes
- Backend `legacyCategoryMap` not touched — new categories match the enum
  exactly, so `normalizeCategory` parses them via `safeParse`; the map only
  remaps old stored legacy strings.
- `COMMUNITY_TEMPLATE_MAX_CATEGORIES` (3 per template) unchanged.
- Verified: shared `tsc` build clean, client `tsc --noEmit` clean for the
  touched files.
