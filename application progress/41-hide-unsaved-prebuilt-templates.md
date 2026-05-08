# 41 — Defer prebuilt template materialization until Save

## Problem

Opening a prebuilt template card from HomeScreen called `POST /emails`
with `templateSlug`, which immediately created an `Email` + `EmailVariant`
in DB before any credit check. Even with backend/frontend gates on the
"Save template" action, the row already existed → showed up in "Recent
emails" / `/campaigns` lists, looking like the template was saved. User
reported saving worked even when out of credits.

## Fix — refactor

Materialization is deferred to the Save action. Opening a template only
fetches an in-memory preview; nothing is written to DB until the user
clicks "Save template" with credits available.

### Backend (`apps/backend`)

- `GET /v1/templates/seed/:slug/preview` (`TemplatesController`,
  `TemplatesService.previewSeed`): returns
  `{ slug, name, componentCode, compiledHtml, variableSchema }` for the
  workspace's seeded template. No DB writes. Uses `ReactToHtmlService`
  to compile on the fly. `TemplatesModule` now imports `GenerationModule`.
- `POST /v1/emails/from-template` (`EmailsController.createFromTemplate`,
  `EmailsService.createFromTemplate`): atomic transaction —
  `assertCanGenerate` → create `Email` (status READY, `templateSavedAt = now`)
  → create `EmailVariant` → create `EmailGenerationRun` (kind INITIAL,
  status COMPLETED). If the credit check throws, no rows are written.
- `EmailsService.create()` rejects `templateSlug` with 400 directing
  callers to the new endpoint.
- `list()` keeps the `OR: [{ templateId: null }, { templateSavedAt: { not: null } }]`
  filter as defense-in-depth for orphan rows from the prior bug.

### Shared (`packages/shared`)

- `TemplateSeedPreviewDtoSchema`, `CreateEmailFromTemplateSchema`.

### Frontend (`apps/frontend`)

- `actions/templates.ts`: `templatesApi.previewSeed(slug)`.
- `actions/emails.ts`: `createEmailFromTemplate(input)`.
- `hooks/use-emails.ts`: `useCreateEmailFromTemplate()`.
- `components/templates/TemplatePreviewScreen.tsx`: new screen. Loads
  the seed preview, renders the compiled HTML in an iframe, shows the
  "1 credit / No credits left" badge plus "Save template" button. Save
  calls `from-template`; on success routes to
  `/campaigns?compose=1&emailId=...`.
- `app/templates/[slug]/preview/page.tsx`: route that parses the slug
  with `TemplateSlugSchema` and reads `prompt`/`tone`/`length`/`audience`
  query params.
- `components/home/HomeScreen.tsx`: clicking a prebuilt template now
  pushes to `/templates/<slug>/preview` with prompt/tone/length/audience
  in the query string instead of calling `createEmail`.
- `components/home/EditorScreen.tsx`: removed the `isPrebuiltUnsaved`
  branch and "Save template" button (and unused `useSaveTemplate`,
  billing query, toast import). The editor now always shows "Send
  campaign" — already-saved prebuilt templates get the same single
  action as user-generated emails.

## Behavior

- Out of credits → click prebuilt template card → preview screen loads
  (no DB write). Click "Save template" → toast "No AI credits left",
  no DB write. Backend would also 403 if the badge was stale.
- Has credits → click prebuilt → preview → click Save → atomic write
  (Email + Variant + Run) → routed to campaigns compose. Credit count
  increments by 1.
- Existing saved prebuilt templates: editor shows only "Send campaign".

## Notes

- `EmailsService.saveTemplate` and the `POST /emails/:id/save` endpoint
  remain wired but are no longer reachable from the UI. Kept for now to
  avoid unused-symbol churn; can be deleted in a follow-up.
- Orphan `Email` rows from the prior bug stay in DB but are filtered
  from list views by the `templateSavedAt` clause in `list()`. A future
  cleanup job could delete them.
