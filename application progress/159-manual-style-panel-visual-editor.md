# 159 — Manual style panel in the visual editor (setStyle op)

**Date:** 2026-07-17

## Problem

The visual editor supported text, image, delete, and drag-reorder edits, but
no manual control over element *properties*: colors, fonts, corner radius,
borders, spacing. Designers had to ask the AI for every visual tweak. The
hard part is the bidirectional TSX↔HTML flow: edits made on the rendered
preview must land back in the stored `componentCode` (single source of
truth) without breaking the AST.

## What was built

### Shared (`packages/shared/src/visual-edit.ts`)

- New `setStyle` op in `VisualEditOpSchema`: `{ nodeId, styles }` where
  `styles` is a map of camelCase CSS property → value (or `null` to remove).
- `VISUAL_EDIT_STYLE_PROPERTIES` allowlist (email-safe only): typography
  (color, fontFamily, fontSize, fontWeight, fontStyle, lineHeight,
  letterSpacing, textAlign, textTransform, textDecoration), fill & border
  (backgroundColor, borderRadius, border*, ), spacing (padding*/margin*),
  sizing (width, maxWidth, height).
- Value sanitization: character allowlist + block of `url(`, `expression(`,
  `javascript`, `@`, `\`, comments — values land in stored TSX and exported
  HTML, so nothing that can smuggle markup/requests is accepted.

### Backend (`apps/backend/src/emails/tsx-visual-ops.ts`)

- `applyStylePatch`: patches the JSX `style={{ … }}` prop via recast AST.
  - Missing `style` attr → created.
  - Inline object → properties updated/added/removed in place
    (format-preserving; untouched code keeps its original print).
  - Non-object expression (`style={sharedObj}`) → wrapped as
    `{ ...sharedObj, patch }` so other elements sharing the object are
    unaffected.
- `setStyle` is **allowed on dynamic elements** (`.map` loops, ternaries):
  one AST node styles every rendered copy uniformly — unlike delete/move it
  is safe, so the dynamic-node refusal is bypassed for this op only.
- Summaries: `Styled <Text> (fontSize, color)` feed the existing chat/system
  timeline.
- 6 new spec cases in `tsx-visual-ops.spec.ts` (58 total pass), incl.
  end-to-end recompile assertions.

### Client (`apps/client`)

- **`StylePanel.tsx` (new)** — docked "Design" panel to the right of the
  preview, Figma-inspector style. Sections:
  - *Text*: font (email-safe stacks + current), size, weight, line height,
    letter spacing, align (segmented icons), text color.
  - *Fill & border*: background, corner radius, border width/style/color.
  - *Spacing*: padding + margin per side (T/R/B/L grid).
  - *Size* (images): width.
  - Controls prefill from the iframe element's **computed style**; color
    swatches use native pickers + hex fields with clear buttons.
  - Every change applies **instantly** to the iframe DOM (live preview) and
    commits as a debounced (450 ms) `setStyle` op through the existing
    autosave pipeline → TSX patched → recompiled → new variant.
- `useVisualEditSelection`:
  - `applyElementStyles(nodeId, styles)` — live-styles every rendered copy
    and refreshes the selection rect after reflow.
  - `readElementStyles(nodeId)` — computed-style snapshot for prefill.
  - **Selection restore**: the selected nodeId survives iframe reloads
    (autosave recompiles bump `docVersion`); style-only saves keep node
    positions stable, so the panel stays open while the designer keeps
    tweaking. Cleared on explicit deselect/exit.
- `useVisualEditAutosave`: consecutive `setStyle` ops on the same node are
  coalesced (last-wins per property) so drag/typing bursts don't blow the
  100-op batch cap.
- `VisualEditToolbar`: new "Style" button (PaintBoard icon) reopens the
  panel if closed; panel auto-opens with the first selection.
- Mobile (`fullWidth`): panel overlays from the right instead of squeezing
  the preview.

## Verified

- `pnpm test` backend: 58/58 pass. `tsc --noEmit` clean on backend + client.
- Live in-browser (localhost): selected `<h1>` → size 32→44 px, selected CTA
  `<Button>` → radius 10→999 px + background `#6056ff`→`#101114`; each change
  previewed instantly, autosaved as versions 37/38/39, and the stored
  componentCode shows the patch merged into the existing style object:
  `style={{ backgroundColor: "#101114", …, borderRadius: "999px", … }}`.
- Panel + selection survive the post-save preview reload.

## Notes / follow-ups

- Removing a property (`null`) deletes the explicit AST entry only —
  spread-inherited values from shared style objects remain.
- Border shorthand (`border`) is allowlisted but the panel edits
  width/style/color separately.
- Possible next: shadow presets, per-corner radius, width/height for
  non-image blocks, font upload.
