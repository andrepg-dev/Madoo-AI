# 162 — Landing category captions link into the templates gallery

**Date:** 2026-07-17

Two small changes:

1. **Editor**: leaving edit mode no longer reopens the Variables panel
   (feedback on 160 — entering edit still closes it; the user reopens it
   manually when needed). Commit `12684b2`.

2. **Landing**: in the homepage "Emails from a single prompt" category
   showcase, the category caption under each preview (PRODUCT LAUNCH /
   NEWSLETTER / OTHER) is now a link to
   `/templates?category=<name>`. `TemplatesGallery` reads the `category`
   query param on mount (case-insensitive match against the available
   categories, via `window.location` to avoid a `useSearchParams` Suspense
   boundary) and pre-selects that chip. The card itself still opens the
   template preview; the caption link stops propagation.

Verified in-browser: hard load `/templates?category=Newsletter` and SPA
click from the homepage both land with the right chip active and the list
filtered.
