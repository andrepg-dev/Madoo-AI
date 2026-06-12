# 47 - Projects, Templates, Search

Date: 2026-06-11

## Client Work

- Added `actions/templates.ts` server actions:
  - `fetchTemplates`
  - `previewSeedTemplate`
  - `saveTemplateFromVariant`
- Added shared template action contracts in `packages/shared/src/emails.ts`.
- Wired template backend list/save responses to shared Zod DTO parsing.
- Replaced static project dashboard views:
  - `/dashboard/projects` uses real `fetchEmails`
  - `/dashboard/projects/created-by-me` uses real `fetchEmails`
  - sort by updated, created, or title
  - filter by backend email status
  - grid/list views
  - project cards open `email-template-project?id=<emailId>`
  - delete mutation updates the `["emails"]` cache
- Added honest future states for:
  - `/dashboard/projects/starred`
  - `/dashboard/projects/shared-with-me`
- Reworked `ProjectShowCase`:
  - "My emails" reads recent cached/fetched emails
  - "Madoo templates" reads seed templates from `fetchTemplates`
  - seed template click opens a preview modal via `previewSeedTemplate`
  - "Use template" calls `createEmailFromTemplate` and routes to the project page
- Reworked `template-card.tsx` for real previews, badges, metadata, and click handling.
- Reworked `SearchCommandModal.tsx`:
  - recents come from cached/fetched emails
  - email result href includes `?id=<emailId>`
  - query supports substring and fuzzy matching
- Sign-out now clears `emails`, `templates`, and `template-preview` query caches.

## Verification

- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/backend/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p packages/shared/tsconfig.json --noEmit`
- HTTP smoke on running client dev server:
  - `GET /` returned 200 and rendered the home/gallery empty state while signed out.
  - `GET /dashboard/projects` returned expected auth redirect.
  - `GET /dashboard/projects/starred` returned expected auth redirect.

## Notes

- Did not run build commands per repository instruction.
- Local Prettier binary was not installed in `node_modules/.bin`; formatting was kept manual.
- In-app browser backend was unavailable, so visual verification fell back to HTTP smoke.
