# 102 — Copy HTML export option

## Problem

The Export modal's File tab only offered downloads (HTML file, Image, PDF).
Users pasting into an ESP editor want the production HTML on the clipboard
directly, without a file round-trip.

## Change (apps/client only)

- `components/project/editor/constants.ts`: new "Copy HTML" entry (Copy01Icon)
  first in `fileExportFormats`.
- `components/project/editor/ExportProviderModal.tsx`: `copyHtml` handler —
  fetches the existing `/api/export/emails/:id/export/html` route (same proxy
  the download uses, respecting the selected variant), writes the response text
  to `navigator.clipboard`, success/danger toasts, busy state on the card,
  `email_exported` PostHog event with `file_kind: "copy_html"`.

No backend changes — reuses the existing export route. `tsc --noEmit` clean.

## Verify

Export modal → File tab → "Copy HTML" → toast "HTML copied"; paste into an
editor and confirm the full production HTML. Older variant selected in preview
→ copied HTML matches that variant.
