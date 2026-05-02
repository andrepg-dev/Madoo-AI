---
date: 2026-05-02
area: phase 2 / frontend contacts + segments
files:
  - apps/frontend/lib/fetch.ts
  - apps/frontend/app/api/v1/[...path]/route.ts
  - apps/frontend/actions/contacts.ts
  - apps/frontend/actions/segments.ts
  - apps/frontend/actions/tags.ts
  - apps/frontend/components/contacts/ContactsScreen.tsx
  - apps/frontend/package.json
  - pnpm-lock.yaml
---

# 24 — Phase 2f frontend contacts and segments wired to real data

## What changed

- Replaced mock contact/segment data usage on `ContactsScreen` with real API data:
  - `useQuery({ queryKey: contactsKeys.list({ segmentId }), queryFn: () => contactsApi.list(...) })`
  - `useQuery({ queryKey: segmentsKeys.list(), queryFn: () => segmentsApi.list() })`
- Added new pure frontend actions (no hooks) with query keys + zod parsing:
  - `apps/frontend/actions/contacts.ts`
  - `apps/frontend/actions/segments.ts`
  - `apps/frontend/actions/tags.ts`
- Added client `fetcher` (`apps/frontend/lib/fetch.ts`) used by the new actions.
- Added authenticated Next proxy route (`apps/frontend/app/api/v1/[...path]/route.ts`) so client-side queries can reach backend endpoints with bearer/workspace headers derived from cookies.

## Import CSV modal flow

- Implemented native HTML5 CSV import flow without external UI/dropzone libs:
  1. Drag/drop or file input (`.csv`)
  2. Client-side preview parse with `papaparse` (headers + first rows)
  3. Column mapping step (`email`, optional `firstName`, `lastName`)
  4. Confirm import (`POST /contacts/import/:jobId/confirm`)
  5. Polling (`GET /contacts/import/:jobId`) until terminal state (`COMPLETED`/`FAILED`)
- Added import progress and row-level error preview in modal.
- Added `papaparse` + `@types/papaparse` to frontend dependencies.

## New segment modal flow

- Added "New segment" modal with prompt-based flow:
  1. Prompt input
  2. Preview call via `POST /segments/from-prompt`
  3. Save segment via `POST /segments`
- On save success:
  - Invalidates segment list query
  - Selects newly created segment in sidebar

## UI behavior updates

- Preserved current layout and visual style (inline styles + design tokens).
- Added empty state when there are no contacts:
  - Message + CTA to open Import CSV modal.
- Segment sidebar now renders dynamic segments from API plus "All contacts".

## Verification

- `pnpm --filter @madoo/frontend build` passes (Next.js compile + type check).
