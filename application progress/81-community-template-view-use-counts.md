# 81 - Community template view + use counts (private)

## Goal

Count how many times a community template is viewed and used, but keep
those numbers private — never exposed on the public landing endpoint.
"Uses" were already tracked (#79); this adds view counting and surfaces
both inside the authenticated app only.

## Prisma

- Added `viewCount Int @default(0)` to `CommunityTemplate` (next to the
  existing `useCount`). Migration `20260615201602_add_community_template_view_count`.

## Shared

- Added `viewCount: z.number()` to `CommunityTemplateDtoSchema`.

## Backend

- `CommunityTemplatesService`
  - `CommunityTemplateRow` carries `viewCount`; `toDto` emits it.
  - `get(id, userId)` increments `viewCount` only when the viewer is not
    the author (authors can't inflate their own stats) and reflects the
    +1 in the returned detail.
  - Public path stays private: `PublicCommunityTemplateDto` /
    `PublicCommunityTemplateRow` now also omit `viewCount` (already
    omitted `useCount`), and `toPublicDto` seeds `viewCount: 0`. The
    landing endpoint never returns view/use counts.

## Frontend

- `project-show-case.tsx`: the community template detail modal
  (`CommunityTemplateUseModal`) shows "N views · N uses" under the
  Variables header. Counts are only visible to authenticated users in
  the gallery, not on the public site.

## Verification

- `pnpm --filter @madoo/shared build` passed.
- Prisma migration applied + client regenerated.
- backend / client `tsc --noEmit` passed.
