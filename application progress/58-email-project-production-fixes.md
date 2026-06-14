---
date: 2026-06-13
area: email-template-project (full stack)
files:
  - packages/shared/src/emails.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260613120000_add_email_visibility_share/migration.sql
  - apps/backend/src/emails/emails.service.ts
  - apps/backend/src/emails/emails.controller.ts
  - apps/backend/src/emails/public-emails.controller.ts
  - apps/backend/src/emails/emails.module.ts
  - apps/backend/src/generation/generation.service.ts
  - apps/client/actions/emails.ts
  - apps/client/app/email-template-project/page.tsx
  - apps/client/app/share/[publicId]/page.tsx
  - apps/client/components/project/preview/DeviceFramePreview.tsx
  - apps/client/components/project/preview/PreviewOverlay.tsx
---

# Email project: production fixes for chat, share, preview

Took the `email-template-project` experience from prototype to production for the
four issues reported by the product owner.

## 1. Initial conversation message was lost

**Symptom:** the first AI reply showed while streaming, then vanished after the
stream finished, leaving a lone user bubble; reloading a still-generating email
showed no progress.

**Cause:** with the `emit_email` tool the model usually returns an empty text
block, so `appendChatMessage` (which skips empty content) persisted no assistant
message. On the post-stream chat refetch, `mapChatMessages` replaced the local
streamed reply with the server state (user-only).

**Fix:**
- `generation.service.ts` — `runInitial`/`runEdit` now always persist a
  non-empty assistant reply (model text when present, otherwise a friendly
  fallback), so it survives the refetch.
- `page.tsx` — `mapChatMessages` always leads with the user's brief and keeps a
  visible "Generating your email…" status while `status === GENERATING` and no
  assistant/status line exists yet (covers reload with no live SSE).

## 2. Real public/private share links (was fake)

The old Share popover was theater (mailto invite, "invite link disabled" text).
Replaced with a real public/private link, full stack:

- **shared:** `EmailVisibility`, `UpdateEmailShareSchema`, `EmailShareDto`,
  `PublicEmailDto`; `EmailDto` gains `visibility` + `publicId`.
- **prisma:** `Email.visibility` (enum, default PRIVATE) + unique `publicId`;
  migration `20260613120000_add_email_visibility_share`.
- **backend:** `EmailsService.setShare` (mints a stable `publicId` on first
  publish, kept across toggles) and `getPublicByPublicId` (serves only PUBLIC
  emails, latest variant only — no workspace/prompt/chat leakage).
  `PATCH /emails/:id/share` (guarded) + new **unauthenticated**
  `PublicEmailsController` `GET /public/emails/:publicId`.
- **client:** `updateEmailShare` + `fetchPublicEmail` actions; `ShareProjectDropdown`
  rewritten as a real toggle (Create link / Make private, copy + open link);
  public read-only page at `/share/[publicId]` (outside the auth middleware).

## 3. Full-screen device-framed preview

The "Preview" button used to dump raw HTML in a new tab. It now opens
`PreviewOverlay`: a full-screen view rendering the email at real device size
inside a desktop browser frame and a phone bezel (`DeviceFramePreview`, toggle
between the two). "Open in new tab" is kept as a secondary action. The same
component renders the public share page.

## 4. Panel toggle button is now ghost

The expand/collapse (panel left/right) button dropped its white background and
`shadow-madoo-border`; it is now a true borderless `ghost` button.

## Verification

- `@madoo/shared` rebuilt (consumed from `dist`).
- `prisma generate` ran; `tsc --noEmit` passes for both backend and client.
- Not yet run against a live DB/browser: apply the migration with
  `pnpm --filter @madoo/backend prisma:deploy` and smoke the share toggle +
  `/share/<publicId>` in the browser.
