# 161 — Invisible saves, Figma-style spacing controls, leaner toolbar

**Date:** 2026-07-17

Three UX refinements to the visual editor, requested after using the Design
panel.

## 1. "Edit text" removed from the floating toolbar

Double-click already starts inline text editing in place; the button was
redundant. Toolbar is now: Replace image (images only) · Style (when panel
closed) · Ask AI · Delete · deselect.

## 2. Saves are invisible — no flicker, no layout shift

Previously each autosave round-trip flashed: the new variant's untagged
compiledHtml rendered while the retagged HTML refetched, which killed the
selection, closed the Design panel, and reloaded the iframe twice.

Fix in `page.tsx`: the editable-HTML query now uses
`placeholderData: (previous) => previous` and the display no longer gates on
`variantId === activeVariant.id`. During a save the previous tagged document
(which already looks identical thanks to live-preview edits) stays on
screen; the iframe swaps once when the fresh tagged HTML arrives, and the
selection-restore keeps the panel open. The Edit button label no longer
flips to "Edit…" while loading (width shift).

## 3. Figma-style quad controls (general + per-side)

New `QuadControl` in `StylePanel.tsx` used for **Padding**, **Margin**, and
**Corner radius**:

- One general field applies a single value to all four sides/corners — it
  writes the CSS shorthand (`padding`/`margin`/`borderRadius`) and clears
  the per-side longhands (removals ordered before the shorthand so the DOM
  preview never drops sides mid-update).
- A toggle (four-corner icon) expands per-side fields (T/R/B/L, corners
  TL/TR/BR/BL) that write longhands, overriding the shorthand.
- Mixed values show a "Mixed" placeholder and auto-expand the per-side grid.
- Per-corner radius props (`borderTopLeftRadius` …) added to the shared
  allowlist.

## Verified

Live in-browser: toolbar shows only Ask AI/Delete/close on text elements;
Margin read `0/0/18/0` → displayed "Mixed" + auto-expanded; padding general
10→24 applied live and saved as `padding: "24px"` (clean shorthand in the
stored TSX, longhands removed); Version 57→58 bump was pixel-identical
except the version label — panel open, selection kept, zero flicker.
tsc clean both apps; backend suite 58/58.
