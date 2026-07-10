# 140 — Landing: Codex-generated hero for Designs & Layouts

## Problem

After removing the broken collage (see 138/139), the "Designs & Layouts" tab
showed a plain newsletter screenshot. User wanted no screenshot there —
something creative instead, generated via Codex.

## Change

- Ran `codex exec` with a detailed image brief: paper-cutout editorial
  illustration of modular email blocks (header, hero, text rows, CTA, footer)
  snapping together into a template; strict palette of Madoo brand tokens
  (paper #f8fafc, ink #101114, violet accent #8b5cf6); no readable text.
- Codex generated a 1254×1254 PNG (1.8 MB); converted to 1024×1024 webp
  (49 KB) with sharp and deleted the PNG.
- `featureTabImages[0]` in `HomePage.tsx` now points to
  `/product/design-your-way-hero.webp` with a descriptive alt.

## Verification

- Inspected the generated image: on-brief (cutout style, brand palette,
  abstract text bars only).
- `tsc --noEmit` clean in apps/landing.

## Deploy

Pushed to main; Vercel auto-deploys `madoo-ai-frontend`.
