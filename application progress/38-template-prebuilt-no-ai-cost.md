# 38 — Pre-built Templates: No AI Generation, No Credits

## Change

Template cards on the home screen now open instantly in the editor with the template already applied. No AI generation is triggered; no credits are consumed.

## Root cause / motivation

The old flow routed every template click through `/emails/[id]/generate`, which streamed AI output and cost credits. Templates are pre-built — the componentCode is already in the database seed. Compiling and storing the variant server-side at creation time is both cheaper and faster.

## Backend — `apps/backend/src/emails/emails.service.ts`

- Injected `ReactToHtmlService` (already exported by `GenerationModule`, already imported by `EmailsModule`)
- In `EmailsService.create()`, when `dto.templateSlug` is present:
  1. Seed + lookup template (existing logic)
  2. `this.reactToHtml.compile(tpl.componentCode)` → `compiledHtml`
  3. Create `Email` with `status: "READY"` (not DRAFT)
  4. Create `EmailVariant` with `seq: 1`, template's `componentCode`, `compiledHtml`, `variableSchema: { variables: [] }`
  5. Return early via `toDto(email.id)` — normal DRAFT path is skipped

## Frontend — `apps/frontend/components/home/HomeScreen.tsx`

- In `onSelectTemplate`, navigate to `/emails/${email.id}/editor` when a `slug` was resolved, `/emails/${email.id}/generate` otherwise (fallback for templates without a seed slug)

## "Save template" button (added on top of original change)

### Backend

- `apps/backend/src/emails/emails.module.ts` — added `BillingModule` to imports
- `apps/backend/src/emails/emails.service.ts` — injected `BillingService`; added `saveTemplate(emailId, workspaceId, userId)`:
  - asserts membership + email exists in workspace + email has `templateId`
  - calls `billing.assertCanGenerate(workspaceId)` (enforces plan quota)
  - creates `EmailGenerationRun { kind: "INITIAL", status: "COMPLETED" }` to record usage
- `apps/backend/src/emails/emails.controller.ts` — added `POST /:id/save` endpoint (before `/:id/generate`)

### Frontend

- `apps/frontend/actions/emails.ts` — added `saveEmailTemplate(emailId)`
- `apps/frontend/hooks/use-emails.ts` — added `useSaveTemplate(emailId)` mutation
- `apps/frontend/components/home/EditorScreen.tsx`:
  - `isPrebuiltTemplate = Boolean(email?.templateId)` — detects template-based email
  - `useSaveTemplate(emailId)` — mutation hook
  - Header button: if `isPrebuiltTemplate`, shows "Save template" (calls mutation → on success navigates to campaigns); otherwise shows "Send campaign" as before

## Result

- Template click → `POST /v1/emails` (with `templateSlug`) → instant READY email with variant → redirect to `/editor`
- Editor shows compiled preview immediately (via `activeVariant.compiledHtml` in iframe)
- AI edits still cost credits; initial render does not
- TypeScript: zero errors on both backend and frontend
