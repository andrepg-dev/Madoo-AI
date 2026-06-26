# 113 — Pexels image search (find_images), Tavily fallback

## Why
`find_images` used only Tavily web image search — scraped web images that are
hotlink-protected/expiring and often low quality. Pexels gives curated stock photos on
a stable CDN, free for commercial use with no attribution required — better fit for
emails.

## Change
`apps/backend/src/generation/website-brand.service.ts`
- `searchImages()` now tries Pexels first; falls back to Tavily when Pexels returns
  nothing (no key / no results).
- New `searchImagesPexels()`: `GET https://api.pexels.com/v1/search?query=&per_page=`
  with `Authorization: <PEXELS_API_KEY>` header, 10s timeout. Picks
  `src.large2x → large → original → medium`; `alt` becomes the description. Throws only
  on 401 (bad key); returns `[]` on any other miss.
- Old Tavily body extracted into private `searchImagesTavily()` (unchanged behavior).
- Added `PexelsPhoto` / `PexelsSearchResponse` types.

## Env
Requires `PEXELS_API_KEY` (free at pexels.com/api; 200 req/hr, 20k/mo). User is adding
it to the backend env. Without the key, Pexels is skipped and Tavily is used as before.

Backend-only; the `find_images` tool contract and frontend are unchanged.
