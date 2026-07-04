# 101 — Persist tool calls in chat

Date: 2026-07-04

## What changed
- Fixed chat history ordering for persisted AI tool calls.
- Backend now returns chat rows ordered by `createdAt` and `id`, so rows inserted
  in the same millisecond have a deterministic order.
- Client chat hydration now applies the same ordering before pairing
  `TOOL_CALL` and `THINKING` rows with the assistant `TEXT` row.

## Root cause
- Tool calls were saved, and the history endpoint included `TOOL_CALL` rows.
- The restore path depended on `TOOL_CALL -> THINKING -> TEXT` order, but the
  endpoint only sorted by `createdAt`.
- Tool call, thinking, and text rows are inserted back-to-back and can share the
  same timestamp, so reloads could receive `TEXT` before its `TOOL_CALL` rows.
  The pending tool-call queue then had no matching assistant text row and the
  cards disappeared.

## Verification
- `pnpm --filter @madoo/backend build`
- `pnpm --filter @madoo/client build`
