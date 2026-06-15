# 85 - Shared email preview frame (merge-tag highlight everywhere)

## Problem

The community-template preview rendered raw `compiledHtml`, so `{{merge
tags}}` showed as plain text instead of the colored highlight used in the
main editor preview. The highlight transform also lived as a private
function inside `email-template-project/page.tsx`, so other previews
couldn't reuse it.

## Changes

- Extracted the transform to `apps/client/lib/highlight-merge-tags.ts`
  (`highlightMergeTags`) — single source of truth (same regex/style as
  before, body text nodes only, never attributes or exports).
- New `apps/client/components/global/email-preview-frame.tsx`
  (`EmailPreviewFrame`): sandboxed iframe that applies the highlight and
  renders the HTML. The one component to use wherever an email preview is
  shown.
- `project-show-case.tsx`: both raw `<iframe srcDoc>` previews (seed
  template modal + community "use" modal) now use `EmailPreviewFrame`, so
  community/seed previews highlight variables like the editor.
- `email-template-project/page.tsx`: removed the local `highlightMergeTags`
  + `MERGE_TAG_*` constants and imports the shared util instead (no
  duplicated logic).

## Verification

- client `tsc --noEmit` passed.
