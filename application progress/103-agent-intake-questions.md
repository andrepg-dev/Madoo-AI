# 103 — Agent intake questions before first draft

## Goal
Make first-time email generation ask one short clarifying round before drafting,
then generate normally after the user answers or says "go".

## Change
Added an initial-intake rule to the generation system prompt:

- first brand-new `INITIAL` turn asks 3-6 focused questions
- skips details already present in the brief
- offers sensible defaults and a "go" / "use your best judgment" fast path
- does not call `emit_email` on that first turn
- never repeats the intake after any assistant turn exists

`runInitial` now computes the gate from current persisted state:

- no variants yet
- no prior assistant chat messages for the email

When that gate is true, the backend adds a per-turn note saying this is the
first intake turn and passes `intakeOnly` into the Anthropic call. Intake turns
run without registered tools, so `emit_email` is not available. The existing
plain assistant TEXT fallback persists the questions cleanly.

On the next no-variant chat turn, the prior assistant message makes the gate
false, so `runInitial` keeps full chat context and generates the email normally.
Edits still use `runEdit` and never hit the intake path.

## Files
- `apps/backend/src/generation/generation.prompts.ts`
- `apps/backend/src/generation/generation.service.ts`

## Verify
`pnpm --filter @madoo/backend build` clean.

## Update — soft intake only when vague
First initial draft turns no longer disable tools. The first-turn prompt now asks
the model to choose: draft immediately with `emit_email` when the brief is
specific enough, or ask one short 3-5 question intake round only when key
specifics are missing. The first-turn gate still limits the ask-or-draft
instruction to brand-new initial drafts, so later turns and edits do not repeat
intake.
