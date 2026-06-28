# 123 — Force emit_email after tool-turn budget exhausted

## Symptom
Generation failed with `"AI inspected context but did not return the email."`
Frontend showed 4 `find_images` searches (university, quantum, iceberg, student)
then the red error — no email produced.

## Root cause
`generation.service.ts` tool loop capped at 4 turns:

```
for (let toolTurn = 0; toolTurn < 4; toolTurn += 1) {
```

Each `find_images` consumes one turn. A complex email needing 4 image
searches ate all 4 turns, leaving none for `emit_email`. After the loop the
last `response.content` still held a non-`emit_email` `tool_use` block, so the
pending-tool guard threw `BadRequestException`, discarding all gathered context.

## Fix (option B — force emit instead of throw)
When a pending non-`emit_email` tool block remains after the loop, do one final
turn forcing the tool instead of throwing. The last tool result is already
appended to `turnMessages`, so the model emits using everything it gathered.

- `runStream` / `runStreamWithRetry`: added optional
  `toolChoice?: MessageCreateParams["tool_choice"]` param; default stays
  `{ type: "auto", disable_parallel_tool_use: true }`.
- `runStream`: forced tool (`type: "tool"` / `"any"`) disables extended
  thinking — Anthropic 400s when thinking + forced tool_choice combine.
- Loop pending-tool guard: replaced `throw` with a forced
  `tool_choice: { type: "tool", name: "emit_email" }` retry turn; accumulates
  its usage and re-emits `token_usage`.

## Files
- `apps/backend/src/generation/generation.service.ts`

## Verify
`npx tsc --noEmit` clean.
