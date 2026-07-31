# 173 — MCP generation quality parity with the platform

Date: 2026-07-31

## Problem

Emails generated through the MCP `generate_email` tool came out noticeably worse
than the same brief run on the platform, even one-shot. The engine is identical
(`/public/generate` → `PublicGenerateService.generate` → `emails.create` →
`GenerationService.generateAnonymousToCompletion` → the same `runInitial` /
`executeAnthropicTurn`, same model, same system blocks, same tools), so the gap
came from context and control flow, not from a second code path.

Root causes found:

1. **Shared anon workspace poisoned the brand kit.** `ensureAnonAccount()` reuses
   one workspace (`anon@madoo.internal`) for every MCP call ever made.
   `runInitial` loaded `loadWorkspaceBrandBlock(workspaceId)` and
   `inspect_website_brand` upserted `workspaceBrandProfile` (unique per
   workspace) — so the previous caller's brand name, colors, fonts and tone were
   injected into the next caller's prompt.
2. **The intake escape hatch fired blind.** The first-turn instructions let the
   model ask 3-5 clarifying questions and skip `emit_email`. On the platform the
   user answers; over MCP there is no second turn, so the run finished chat-only
   and the email had zero variants.
3. **A variant-less email still got a share link.** `setShare` +
   `watermarkLatestVariant` ran regardless, so the caller received a preview URL
   pointing at nothing.

## Changes

`apps/backend/src/generation/generation.service.ts`

- `runInitial`'s last param renamed `skipBilling` → `anonymous` (same call site,
  now carries more meaning than billing).
- Anonymous runs skip `loadWorkspaceBrandBlock` entirely.
- Anonymous runs get their own first-turn instructions: one-shot, never ask
  questions, fill gaps with specific choices, call `emit_email` this turn.
- `executeAnthropicTurn` takes `anonymous?: boolean`; the
  `workspaceBrandProfile.upsert` is skipped when set (no more cross-caller
  leak).
- If an anonymous turn comes back prose-only (and the tool-budget forced-emit
  path did not already run), one extra turn is issued against the same history
  with `tool_choice: emit_email` instead of returning chat-only.

`apps/backend/src/public-generate/public-generate.service.ts`

- After generation, `variantCount(emailId)` is checked. Zero → one retry with an
  explicit "draft now, do not ask questions" prompt override. Still zero → throw
  (the existing catch refunds the caller's IP quota) instead of minting a share
  link to an empty email.

Typecheck clean (`tsc --noEmit`).

## Follow-up (not done here)

- Prod has a stale `workspaceBrandProfile` row on the anon workspace. It is no
  longer read, but deleting it is tidy.
- MCP progress UX (SSE out of `/public/generate`, MCP `notifications/progress`,
  a live `/share/:publicId` watch page, returning the preview PNG as an image
  content block) — designed but not implemented.
