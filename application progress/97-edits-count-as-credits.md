# 97 — Template edits / chat messages count as credits

## Goal
Every AI message — initial draft, chat reply, template edit — consumes one
credit and is gated by the plan's daily/monthly caps. Previously only the
initial draft (`INITIAL` run) was charged; chat/edit (`EDIT` runs) were free and
ungated.

## Credit rule (unchanged shape, widened scope)
1 credit = 1 non-failed `EmailGenerationRun`. `GenerationRunKind` is
`INITIAL | EDIT`; both now count.

## Changes
### billing.service.ts — `countCreditsUsed`
Filter widened from `kind: "INITIAL"` to `kind: { in: ["INITIAL", "EDIT"] }`.
Used by both `assertCanGenerate` (daily + monthly) and `getOverview`, so edits
now both count toward usage and trigger the cap.

### generation.service.ts — `runEdit`
Added `await this.billing.assertCanGenerate(workspaceId)` at the top, mirroring
`runInitial`. The edit path (`editEmailStream`) and regenerate-of-an-edit
(`regenerate` → `runEdit`) are now gated before the model call.

## Behavior
- `editEmailStream` (user chat/edit) → 1 credit, gated.
- `generateEmailStream` (initial) → 1 credit, gated (already was).
- `regenerate` → re-runs via `runInitial`/`runEdit`, so a regeneration also costs
  a credit (each AI generation = one credit). Consistent, simplest rule.
- Failed runs (`status FAILED`) never count — natural refund on error.

## Verification
- backend `tsc --noEmit` — clean.
- Only one `emailGenerationRun.count` in the codebase (billing.service), so the
  credit definition has a single source of truth.

## Note
Daily/monthly caps (FREE 5/30 … PRO 50/550) were calibrated as total AI messages;
now that edits count, a chat-heavy session draws down the same allowance — which
is the intended behavior.
