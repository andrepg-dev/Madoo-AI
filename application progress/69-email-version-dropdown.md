---
date: 2026-06-14
area: email-template-project (version history)
files:
  - apps/backend/src/emails/emails.service.ts
  - apps/client/app/email-template-project/page.tsx
---

# Email version dropdown

Every generate/edit already creates an `EmailVariant` (incrementing `seq`).
Exposed those as selectable versions.

## Backend

- `toDto` returned only the last 3 variants (`take: 3`); bumped to `take: 50`
  so the full edit history is available to the client.

## Client

- **`VersionsDropdown`** (preview toolbar, next to the Variables toggle): lists
  `email.variants` newest-first as "Version {seq}", marks the latest and the
  active one (check). Hidden when there's only one version.
- `selectedVariantId` state in the page; `activeVariant = variants.find(
  selected) ?? latest`. The preview iframe, subject, merge-tag highlight, and the
  Variables panel all read from `activeVariant`, so picking a version shows that
  exact render. An effect resets the selection to the latest whenever a new edit
  produces a new variant.
- `EmailPreviewSidebar` now takes the active `variant`, the version list (via
  `email`), and `onSelectVersion`.

## Notes

- Chat edits still build on the latest variant (the edit baseline), so selecting
  an old version is view-oriented; sending a new instruction jumps back to the
  newest. Editing a variable while viewing an old version updates that version in
  place.
- No schema/migration change — variants were always stored.

## Verify

`tsc` clean for backend and client. Backend restart needed for the higher
`take`. After two+ edits, the dropdown lists the versions and selecting one
swaps the preview.
