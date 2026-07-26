# 171 — Remove `tone` from MCP generate_email

## Why
`tone` param on the MCP acquisition tool wasn't adding value. Removed end-to-end.

## Changes
- `apps/mcp/src/server.ts` — dropped the `tone` zod field + handler arg.
- `apps/mcp/src/madoo.ts` — dropped `tone` from `generateAnonymous` input.
- `packages/shared/src/public-generate.ts` — dropped `tone` from
  `PublicGenerateSchema` (rebuilt `@madoo/shared`).
- `apps/backend/src/public-generate/public-generate.service.ts` — dropped the
  `Tone: …` line from `buildPrompt`.

## Verify
- `@madoo/shared` rebuilt; `npx tsc --noEmit` clean in backend + mcp.
