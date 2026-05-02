---
date: 2026-05-02
area: phase 2 / segments smart prompt endpoint fix
files:
  - packages/shared/src/contacts.ts
  - apps/backend/src/segments/dto/segment-from-prompt.dto.ts
  - apps/backend/src/segments/segments.controller.ts
  - apps/backend/src/segments/segments.service.ts
  - apps/frontend/actions/segments.ts
---

# 26 — Phase 2g fix: `/segments/from-prompt` backend endpoint

## Problem

- Frontend smart segment modal called `POST /api/v1/segments/from-prompt`.
- Backend did not implement this endpoint yet, producing `Cannot POST /api/v1/segments/from-prompt`.

## Changes

- Added shared contracts in `@madoo/shared`:
  - `SegmentFromPromptInputSchema`
  - `SegmentPreviewSchema`
  - `SegmentFromPromptPreviewSchema`
- Added backend input DTO:
  - `SegmentFromPromptDto` with `prompt: string`.
- Added backend route:
  - `POST /segments/from-prompt` in `SegmentsController`.
- Added backend service flow:
  - `previewFromPrompt(workspaceId, userId, prompt)`
  - infers `SegmentQuery` from prompt text (status + "last N days" + workspace tag-name matches)
  - computes preview (`count` + `sampleContacts`) using existing segment query compiler.
- Updated frontend segment action to parse `fromPrompt` response with shared schemas.

## Verification

- `pnpm --filter @madoo/backend build` passes.
- `pnpm --filter @madoo/frontend build` passes.
