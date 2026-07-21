# 165 — S3 storage cleanup and preview retention

## Goal
Shrink the production S3 bucket, which had accumulated one screenshot per email
generation / edit / template save since April, and stop it regrowing.

## Audit (prod, 2026-07-21)
Bucket `zot-bucket` (us-east-2), 1358 objects / 246.0 MB.

Referenced keys were extracted from every column that can hold one:
`User.avatarUrl`, `Workspace.avatarUrl`, `WorkspaceBrandProfile.logoUrl`/
`imageUrls`, `PendingPrompt.imageUrls`, `EmailChatMessage.imageUrls`,
`EmailVariant.previewUrl`/`componentCode`/`compiledHtml`,
`EmailVfsSnapshot.componentCode`, `Template.componentCode`, and all three
`CommunityTemplate` text columns — the HTML/code blobs matter because embedded
`found-images` and `email-icons` URLs live only there, not in a URL column.

| tier | objects | size | outcome |
| --- | --- | --- | --- |
| A — screenshot orphans (`email-previews` 400, `previews` 176, `community-previews` 7, `email-icons` 9) | 592 | 80.2 MB | deleted |
| A2 — variant previews past newest-2 per email | 131 | 43.1 MB | deleted + `previewUrl` nulled |
| B — content orphans (`found-images` 332, `email-images` 12, avatar 1, attachment 1) | 346 | 57.5 MB | deleted |
| C — bare-UUID root keys | 51 | 2.7 MB | **kept, not ours** |
| live references | 238 | 62.6 MB | kept |

Result: 289 objects / 65.2 MB. Reverse check found 3 dangling `found-images`
refs that predate the cleanup (none were in the delete list; one has a malformed
UUID) — pre-existing broken images, left alone.

## Important: the bucket is shared
`api-zot-api-1` on the same host runs with `AWS_BUCKET_NAME=zot-bucket` and the
same region. The 51 root-level keys are bare UUIDs with no extension, which
Madoo never writes (`S3Service.uploadBuffer` always emits `folder/uuid.ext`), so
they belong to the other app. Any future cleanup must stay inside Madoo's
prefixes and never touch root-level keys.

## Changes
- **email-variant-retention.service.ts** — `prune()` now runs two sweeps:
  - `pruneVersions()` — unchanged, drops variant rows past
    `MAX_EMAIL_VERSIONS` (20) and their unshared preview objects.
  - `prunePreviews()` — new. Clears preview objects for variants past
    `MAX_EMAIL_PREVIEWS` (2) while **keeping the variant rows**, so version
    history stays navigable. Nulls `previewUrl` before deleting from S3, so a
    failed delete leaves a harmless orphan instead of a row pointing at a
    missing image. Skips objects a `CommunityTemplate` shares or a newer
    variant still points at.
- **email-variant-retention.spec.ts** — added cases for the preview cap and the
  community-shared guard.

## Notes
- 2 previews is safe because only the newest variant's preview is ever
  rendered: `ProjectLibrary.tsx:157`, `show-case-utils.ts:166`,
  `SearchCommandModal.tsx:157`, and the share page's OG image. The spare covers
  the just-superseded case.
- Tier B carried real risk and was deleted on an explicit call: `exportHtml`
  lets users send templates through their own ESP, so an image orphaned in the
  DB by a later edit could still be live in an already-sent campaign. No backup
  was taken.
- Screenshots still cost one upload per generation/edit/save; the retention
  sweep now caps the standing total at 2 per email instead of 20.
