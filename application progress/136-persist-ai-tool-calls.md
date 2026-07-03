# 136 — Persist AI tool calls in email chat

Date: 2026-07-03

## What changed
- Shared email chat contract now includes `TOOL_CALL` and a reusable
  `EmailChatToolCallPayloadSchema`.
- Backend Prisma enum now includes `TOOL_CALL`, with manual migration:
  `apps/backend/prisma/migrations/20260703000000_add_tool_call_chat_kind/migration.sql`.
- Generation flow now collects completed tool calls, persists them as chat rows
  before assistant thinking/text rows, and restores them in recent chat context
  as readable tool-call summaries.
- Client chat hydration now rebuilds tool calls from persisted rows and attaches
  them to assistant messages, including grouped response versions.
- Admin chat schema now accepts `TOOL_CALL` rows too.

## Verification
- `pnpm --filter @madoo/shared build`
- `npx prisma generate` in `apps/backend`
- `npx prisma migrate deploy` in `apps/backend` skipped: DB at `localhost:5433`
  unreachable (`P1001`)
- `npx tsc --noEmit` in `apps/backend`
- `npx tsc --noEmit` in `apps/client`

