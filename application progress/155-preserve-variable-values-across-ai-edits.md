# 155 — AI edits no longer wipe user-set variable values (uploaded images)

Date: 2026-07-13
Branch: main

## Problem

Replacing an image variable (e.g. `logoUrl`) via the Variables panel stores
the uploaded S3 URL only in the variant's `variableSchema` JSON — the
component code keeps its original default. The AI edit flow (`runEdit`) never
showed the model the stored schema and rebuilt `variableSchema` from the
model's `emit_email` payload, so the model re-emitted the stale code default
and the user's upload silently disappeared on the next AI edit.

## Fix

1. **Deterministic merge** — `mergeUserVariableOverrides` in
   `packages/shared/src/emails.ts`: after the model emits a schema, any
   variable whose stored value differed from the base code default (i.e. a
   user override) gets its value + scope restored — unless the model emitted
   a genuinely new value (different from both the old code default and the
   user's value), which means the instruction changed that variable on
   purpose. Wired into `executeAnthropicTurn` via a new
   `preserveVariablesFrom` param, applied right after
   `sanitizeGeneratedVariableSchema` and before compile, so the preview and
   the persisted variant both carry the preserved values. Only the EDIT flow
   passes it; INITIAL generation is untouched.
2. **Prompt context** — the edit prompt now includes a
   "Current variables (authoritative user-set values…)" JSON block from the
   base variant's stored schema, so the model sees the real current values in
   the first place.

The manual visual-edit path (`applyVisualEdit`) already carried the schema
forward and needed no change.

## Tests

New `apps/backend/src/emails/variable-merge.spec.ts` (added to the test
script): restores reverted uploads, keeps deliberate model changes, leaves
non-overridden variables alone, tolerates malformed stored schema. 52/52
backend tests pass.
