# 40 — Distinguish saved templates from pre-built (unsaved) ones

## Problem

In the editor, the "1 credit / No credits left" badge and the **Save template** button were appearing for *every* email whose `templateId` was set — including templates the user had already saved into their workspace. Once a user has saved a template, hitting the editor for that email should:

- **Not** charge an AI credit on a second save (it's already theirs).
- Show a **Send campaign** button that routes to `/campaigns?compose=1&emailId=…`.
- **Not** display the "No credits left" badge when the workspace is at its monthly AI limit.

The bug was that `isPrebuiltTemplate = Boolean(email.templateId)` stayed `true` forever, since the first save did not record any "this email is now a workspace template" marker on the `Email` row.

## Fix

Persist a `templateSavedAt` timestamp on the `Email` row when `saveTemplate` succeeds, expose it on the DTO, and gate the editor UI on `templateId && !templateSavedAt`.

### Backend

- `apps/backend/prisma/schema.prisma` — added `templateSavedAt DateTime?` on `Email`.
- `apps/backend/prisma/migrations/20260507120000_email_template_saved_at/migration.sql` — `ALTER TABLE "Email" ADD COLUMN "templateSavedAt" TIMESTAMP(3)`.
- `apps/backend/src/emails/emails.service.ts`
  - `saveTemplate()` — selects `templateSavedAt`, rejects with `BadRequestException("Template already saved.")` if already set, and now does the `EmailGenerationRun.create` + `Email.update({ templateSavedAt: new Date() })` in a single `$transaction` so the credit charge and the saved-flag move atomically.
  - `toDto()` — includes `templateSavedAt: row.templateSavedAt?.toISOString() ?? null` in the parsed DTO.

### Shared

- `packages/shared/src/emails.ts` — `EmailDtoSchema` gains `templateSavedAt: z.string().nullable()`.

### Frontend — `apps/frontend/components/home/EditorScreen.tsx`

- New derived flag: `isPrebuiltUnsaved = isPrebuiltTemplate && !email?.templateSavedAt`.
- Billing overview query is `enabled: isPrebuiltUnsaved` (no extra fetch for already-saved templates).
- Header right-hand actions branch on `isPrebuiltUnsaved`:
  - `true` → `1 credit` / `No credits left` badge + **Save template** button.
  - `false` → **Send campaign** button (routes to the campaigns composer). This now correctly fires for both regular generated emails and pre-built templates the user has already saved.

## Result

- Pre-built template (first time) → 1-credit badge + **Save template** → on success, sets `templateSavedAt` server-side, invalidates `["email", emailId]`, and routes to `/campaigns?compose=1`.
- Same template viewed again → no badge, no credit interaction, button reads **Send campaign**, even when the workspace is at its monthly AI limit.
- TypeScript clean on backend + frontend; Prisma client regenerated.

## Follow-up — toast on Save click when out of credits

Earlier the **Save template** button was `disabled` whenever the workspace was at its monthly AI generation limit, leaving users with no signal beyond the "No credits left" badge. Replaced with an active button + click-time guard:

- `apps/frontend/components/home/EditorScreen.tsx`
  - Removed `isAtGenerationLimit` from the button's `disabled` predicate.
  - In `onClick`, if `isAtGenerationLimit`, fire a `danger` toast (`"No AI credits left"` → "You've reached your monthly AI credit limit. Upgrade your plan to save more templates.") and short-circuit before the mutation runs.

Result: badge still indicates the at-limit state; click now gives an explicit, dismissible toast instead of a silently-disabled button.
