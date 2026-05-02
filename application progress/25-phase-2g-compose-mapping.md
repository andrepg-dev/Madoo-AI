---
date: 2026-05-02
area: phase 2 / compose modal variable mapping
files:
  - apps/frontend/components/campaigns/ComposeModal.tsx
---

# 25 — Phase 2g compose step 3 variable mapping

## Scope

- Refactored only step 3 ("Map your variables") in `ComposeModal`.
- Left steps 1, 2, 4, and 5 unchanged.

## What changed in step 3

- Replaced mock-driven variable source (`EMAIL_VARIABLES`) with real variable data from:
  - `currentVariant.variableSchema.variables`
- Introduced dynamic map state keyed by variable `name` (e.g. `recipientName`) instead of mock tokens.
- Mapping now targets contact CSV/custom fields via the existing field selector.
- Fallback behavior now reflects real component inline defaults:
  - If mapped field value is missing for a contact, UI shows that the variable resolves to `variable.default`.

## Step 3 UX adjustments

- Header now reports mapped variable count (`matched / total`).
- Added warning banner when no real `currentVariant` is available yet.
- Variable rows now display:
  - variable name
  - mapped contact field selector
  - inline default value from `variableSchema`
  - `not mapped` status when empty
- Preview panel now renders per-variable resolved values based on selected preview contact + mapping + inline defaults.

## Verification

- Build passed:
  - `pnpm --filter @madoo/frontend build`
