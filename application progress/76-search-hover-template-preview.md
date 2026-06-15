---
date: 2026-06-14
area: client (search command modal — hover preview)
files:
  - apps/client/components/shell/SearchCommandModal.tsx
---

# Search modal: hover a project to preview its template

## Goal

Hovering a recent-project row in the search command palette should render the
email template on the right side of the modal.

## Implementation

- Modal widened (720 → 980px) and switched from a single column to a two-pane
  flex-row: left = search list (fixed `sm:w-[440px]`), right = preview `<aside>`.
- New `previewItem`: the active item only when its group is "Recent projects" and
  it has `imageSrc` (recent-project rows carry the rendered template screenshot
  in `imageSrc`; provider rows carry a favicon, so they're excluded).
- Right pane shows `previewItem.imageSrc` (the preview screenshot, which now
  includes highlighted merge tags + loaded images) in a scrollable container, or
  a "Hover a recent project…" placeholder otherwise.
- Hover already drives selection via the row's `onMouseEnter` → `setActiveIndex`,
  so the preview follows the cursor with no extra wiring.
- Right pane hidden on mobile (`hidden sm:flex`); left column goes full width.

## Verify

`tsc --noEmit` clean for apps/client.
