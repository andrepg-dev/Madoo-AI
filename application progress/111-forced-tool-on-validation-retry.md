# 111 — "Retry did not return emit_email tool output" fixed

## Diagnosis

When an emit_email payload failed validation/compilation, the corrective retry
turn ran WITHOUT `tool_choice` — the model was merely asked in prose to
"return a corrected emit_email payload". Sometimes it answered with plain text
instead of calling the tool, and the user saw the raw error
"Retry did not return emit_email tool output."

## Fix (generation.service.ts, deployed to VPS)

- The validation-retry `runStream` call now forces
  `tool_choice: { type: "tool", name: "emit_email", disable_parallel_tool_use: true }`
  (same shape as the budget-exhausted finalization turn) — the API then
  guarantees an emit_email block, so the failure mode disappears.
- The residual safety-net error message was rewritten to a user-friendly one
  ("The AI could not produce a corrected email this time — send the request
  again.") in case anything else ever trips it.

Note: forced tool choice disables thinking on that turn (existing runStream
behavior) — fine for a mechanical correction pass.

## Verify

Hard to reproduce on demand (needs a validation failure). Watch for the toast
disappearing from real usage; validator retries should now silently produce a
corrected draft.
