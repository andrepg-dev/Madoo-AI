# 163 — Landing template showcase as marquee + changelog/what's-new

Date: 2026-07-17
Branch: main

## Feature

Homepage "Emails from a single prompt" section: the fixed 5-tile
category-overview row is now a continuous horizontal **marquee** of every
community template whose screenshot is tall enough for the uniform tiles.

## Implementation

- **`components/HomePage.tsx`**
  - Dropped `pickCategoryShowcase` / one-card-per-category selection. Now takes
    up to `SHOWCASE_MAX` (24) templates, filters by height via
    `useTallTemplates`, and renders them in a repeating marquee track.
  - `showcaseCopies` = 4 when < 8 templates else 2, so a short set still fills
    the viewport width. Track shifts by one copy per loop for a seamless restart.
  - `--marquee-duration` = `copies * count * 4s` (speed tuned across commits:
    8s → 4s per card).
  - Duplicate marquee copies are `aria-hidden` + `tabIndex={-1}` so each template
    is announced/tabbed once.
  - Cards fixed-width (`w-56 sm:w-64 shrink-0`) for the horizontal track.
- **`components/home/TemplatePreviewImage.tsx`** — removed now-unused
  `pickCategoryShowcase`.
- **`app/globals.css`** — `@keyframes madoo-template-marquee` +
  `.madoo-template-marquee`. `prefers-reduced-motion: reduce` disables the
  animation. (Hover-pause and edge-fade mask were added then removed per
  feedback: emails keep moving on hover, no horizontal shadow.)

## Changelog / What's new

- `apps/landing/components/Changelog.tsx` — new July 17 2026 entry (en + es):
  "A livelier template showcase" / "Una galería de plantillas con más vida".
- `apps/client/components/shell/WhatsNewPanel.tsx` — same entry (en).

## What's-new panel polish

- Scroll container now uses `.madoo-command-scrollbar` (thin, subtle thumb)
  instead of the chunky default browser scrollbar, plus `rounded-lg` +
  `overscroll-contain`.
- `Sidebar.tsx` — the What's-new `DropdownContent` gains `overflow-hidden` so
  the panel content is clipped to the dropdown's rounded shape; removes the
  stray straight line where the square inner content met the rounded border.

## Verified

- Typechecks clean (landing).
- Marquee track measured in browser: 4 groups × 4 cards, seamless shift by
  one copy width. Animation only suppressed locally by the dev machine's
  `prefers-reduced-motion: reduce` OS setting.

Ships via Vercel on push. No backend change.
