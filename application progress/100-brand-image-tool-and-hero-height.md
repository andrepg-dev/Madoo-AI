# 100 — Brand image tool and hero height guidance

Date: 2026-07-04

## Problem
Brand URL prompts could still pull generic Pexels photos through `find_images`
instead of using the brand site's own product/lifestyle/banner imagery. Generated
hero images also tended to become too tall for normal marketing emails.

## Change
`apps/backend/src/generation/generation.tools.ts`
- Added `find_brand_images` Anthropic tool. Input is a brand `url` plus optional
  visual `query`. Tool description tells the model to prefer it over
  `find_images` whenever a brand URL is known.

`apps/backend/src/generation/website-brand.service.ts`
- Added `findBrandImages(url, query?)`.
- Fetches the brand page, extracts usable image candidates with alt text/fallback
  filename descriptions, then crawls up to 4 same-origin product/shop/collection
  pages for more imagery.
- Filters obvious icons, sprites, SVGs, tracking pixels, and tiny images; dedupes;
  ranks query matches first; caps output at 20.
- Returns `[]` on failures so the agent can fall back.

`apps/backend/src/generation/generation.service.ts`
- Registered and dispatched `find_brand_images` beside `find_images`.
- Rehosts selected brand images before returning them to the model, matching the
  existing image-search flow.

`apps/backend/src/generation/generation.prompts.ts`
- Added image priority: attached images first, then brand images
  (`inspect_website_brand` / `find_brand_images`), then stock photos only as a last
  resort.
- Added hero image height rule: default to a modest 240-320px landscape treatment
  unless the user asks for a large/full-bleed hero.

## Verification
Backend build/typecheck requested; run after code changes.
