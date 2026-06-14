---
date: 2026-06-14
area: backend (email generation — unsubscribe link)
files:
  - apps/backend/src/generation/generation.service.ts
  - apps/backend/src/templates/seed-templates.ts
---

# Unsubscribe link is now an editable variable

## Why

The unsubscribe link was hardcoded as `<a href="#">Unsubscribe</a>` in every
seed template, so the model copied that — it wasn't in the variable schema (not
editable in the Variables panel) and the Links tester flagged it as a broken
"Placeholder link".

## Fix (generation prompt + few-shot seeds)

- `STATIC_INSTRUCTION`: added a rule that every meaningful link must point to a
  URL variable, never a bare `href='#'`; the primary CTA uses `ctaUrl` and the
  footer unsubscribe uses `unsubscribeUrl` (scope=dynamic, role=url) so the
  sending platform injects the real opt-out URL. Added `unsubscribeUrl` to the
  dynamic-examples and allowed-variables lists.
- Few-shot seed templates (launch, newsletter, sale, welcome): replaced the
  hardcoded `href="#"` unsubscribe with an `unsubscribeUrl` prop + `href=
  {unsubscribeUrl}`, so the examples match the instruction.

Now new emails expose `unsubscribeUrl` in the Variables panel: dynamic by
default (renders as the highlighted `{{unsubscribeUrl}}` merge tag), and the
user can flip it to static to set a fixed opt-out URL.

## Notes

- Backend restart required (prompt/seeds are in-memory constants). Existing
  emails keep their hardcoded `#` until regenerated.
- Other seeds (event, digest, thanks, feature, survey, reengage, referral,
  minimal) still hardcode `#`; only the four few-shot examples were updated, plus
  the instruction that drives all generations.

## Verify

`npx tsc --noEmit -p apps/backend/tsconfig.json` → clean.
