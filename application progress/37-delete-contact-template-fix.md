# 37 — Delete Contact + Template Section Fix

## Changes

### 1. Template section ("Or start with a template") — fixed

**Root cause:** `EmailsService.create()` called `prisma.template.findUnique()` on a `templateSlug` before seeds existed for the workspace. `ensureSeedForWorkspace()` was only triggered from `GET /v1/templates`, never from `POST /v1/emails`. The frontend silently swallowed the resulting `BadRequestException`.

**Backend:**
- `apps/backend/src/emails/emails.module.ts` — added `TemplatesModule` to imports
- `apps/backend/src/emails/emails.service.ts` — injected `TemplatesService`; call `ensureSeedForWorkspace(workspaceId)` before the `templateSlug` lookup

**Frontend:**
- `apps/frontend/components/home/HomeScreen.tsx` — added `templateError` state; replaced `catch { /* noop */ }` with real error handling; renders a `Banner` with the error message above the template grid

### 2. Delete contact — implemented

**Frontend only** (backend DELETE `/v1/contacts/:id` already existed):
- `apps/frontend/actions/contacts.ts` — added `contactsApi.delete(contactId)`
- `apps/frontend/components/contacts/ContactsScreen.tsx`:
  - Added `deleteContactsMutation` (deletes all target IDs in parallel, invalidates cache)
  - Added `deleteTargetIds` state + `hoverContactId` state
  - Bulk toolbar: "Delete" (`danger` button) → sets `deleteTargetIds = [...selected]`
  - Per-row: trash icon (`x`) appears on row hover → sets `deleteTargetIds = [contact.id]`
  - Confirmation modal: "Delete contacts" shows count, Cancel/Delete buttons

### 3. Tracking — pending

Awaiting user clarification on specific symptom (0% always? specific scenario? what does "securing delivery" mean?).
