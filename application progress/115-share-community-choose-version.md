# 115 — Choose which email version to publish to the community

## Why
Community share always published the latest variant (`orderBy seq desc, take 1`). User
wants to pick which version goes public.

## Shared — `packages/shared/src/emails.ts`
- `ShareEmailToCommunitySchema`: added optional `variantSeq` (positive int = the 1-based
  EmailVariant.seq / version number). Omitted → latest, as before. Rebuilt `@madoo/shared`.

## Backend — `apps/backend/src/community-templates/community-templates.service.ts`
- `share()`: when `variantSeq` is provided, filter variants by `{ seq: variantSeq }`;
  otherwise keep latest. Not-found error message now names the missing version.

## Frontend — `apps/client/components/project/editor/ShareProjectDropdown.tsx`
- Added a "Publish version" `Select` under the Community row, shown only when the email
  has more than one version. Options list versions newest→oldest ("Version N · latest").
- New `shareSeq` state (defaults to latest); passes `variantSeq: selectedSeq` into
  `shareEmailToCommunity`. Resets when switching emails.

Full-stack: schema + backend handler + frontend action, per CONVENTIONS. Typecheck clean.
