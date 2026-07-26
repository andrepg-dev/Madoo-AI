# 170 — find_brand_images: more images, no repeats

## Problem
The `find_brand_images` tool showed only 4 images per call and returned the
**same** top images on every call, regardless of the query — so the agent kept
"finding" identical images across searches (portadas / novedades / infantiles
all surfaced the same 4).

## Root cause
`generation.service.ts` capped each result at `.slice(0, 4)`, and each call
re-ran `findBrandImages` → `rankBrandImages` which returns the same top-ranked
candidates every time (query only nudges ranking; size/logo score dominates).
No memory of what was already handed to the model.

## Fix
`apps/backend/src/generation/generation.service.ts` (`executeAnthropicTurn`)
- Added a per-turn `seenBrandImageUrls: Set<string>`.
- `find_brand_images` now filters out already-seen source URLs, takes up to **8**
  fresh ones, and records them as seen.
- When the pool is exhausted, returns empty with a note telling the model it has
  already seen every brand image and to stop calling the tool (kills the loop).
- Emitted thumbnails no longer capped at 4 — shows all returned (≤8).

`apps/backend/src/generation/website-brand.service.ts`
- `MAX_BRAND_IMAGE_CRAWL_PAGES` 4 → 6 to widen the candidate pool.

## Verify
- `npx tsc --noEmit` clean in backend.
