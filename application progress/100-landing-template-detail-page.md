# 100 — Landing template detail page (HTML preview, full page)

**Date:** 2026-07-08

## Goal

Replace the image-based template preview **modal** on the marketing landing with a
full **page** that renders the actual email **HTML in an iframe**: template on the
left, info on the right, recommended templates below. More professional, on-brand.

## Backend (`apps/backend`)

New **public** endpoint to expose compiled HTML (previously only the screenshot
`previewUrl` was public; `compiledHtml` was authed-only via `get(id)`):

- `community-templates.service.ts`
  - Inject `ReactToHtmlService`.
  - `getPublic(id)` → returns the public DTO **+ `compiledHtml`**.
    - DB rows: read stored `compiledHtml`.
    - Seed slugs (`seed-<slug>`, the empty-DB fallback gallery): compile
      `componentCode` on the fly with `reactToHtml.compile(...)`.
    - `NotFoundException` for unknown ids / bad seed slugs.
  - Added `PublicCommunityTemplateDetailDto = PublicCommunityTemplateDto & { compiledHtml }`.
- `public-community-templates.controller.ts` → `GET /v1/public/community-templates/:id`.
- `community-templates.module.ts` → import `GenerationModule` (provides `ReactToHtmlService`).

## Landing (`apps/landing`)

- `lib/community-templates.ts`
  - `LandingCommunityTemplateDetail = LandingCommunityTemplate & { html }`.
  - `fetchLandingCommunityTemplate(id)` → fetches `/public/community-templates/:id`,
    validates, maps `compiledHtml` → `html`. Returns `null` on failure/empty HTML.
- `app/templates/[id]/page.tsx` (new, dynamic route)
  - Fetches detail + full list in parallel; `notFound()` if missing.
  - `recommended` = list minus current, first 10.
  - `generateMetadata` (title/description/OG image from previewUrl).
- `components/TemplateDetail.tsx` (new client component)
  - `LandingHeader`, back link to `/templates`.
  - 2-col grid `lg:grid-cols-[minmax(0,1fr)_380px]`:
    - **Left:** framed "browser" card → **sandboxed iframe** (`srcDoc={html}`,
      `sandbox=""`, `referrerPolicy="no-referrer"`) so email CSS can't leak.
    - **Right (sticky):** category chip, name, author, description, **Use template**
      button (same auth flow as gallery), variables list.
  - **Below:** "More templates" grid → image cards linking to each detail page.
  - `AuthDialog` for the Use-when-signed-out flow.
- `components/TemplatesGallery.tsx`
  - Gallery cards now **`<Link href={/templates/:id}>`** instead of opening the modal.
  - Removed the `TemplatePreviewDialog` usage + preview/use state; kept `AuthDialog`
    for header sign-in.
- `components/HomePage.tsx`
  - Showcase cards with a real id → `router.push('/templates/:id')`; id-less
    decorative sample cards still open the lightweight modal.
  - Added copy strings (en + es): `detailBack`, `preview`, `recommended`,
    `recommendedDescription`.

## Verification

- `tsc --noEmit` clean for **both** backend and landing.
- Landing `next build` clean; `/templates/[id]` correctly classified **ƒ (Dynamic)**.
  Build-time `ECONNREFUSED` is expected (no local backend) and is swallowed by the
  fetch helpers (return `[]`/`null`).
- **Not** verified live: local backend not booted (Redis down on :6379, Prisma
  client not generated). Prod backend does not yet have the new `:id` route.
  Confirm rendering after deploy.

## Deploy note

Backend endpoint is **new** — must deploy backend (manual: git pull + docker compose
up --build) before the landing detail pages resolve on prod.

## Update (same day) — preview polish (`8a67c1b`, landing-only)

- Narrower preview: grid `[minmax(0,1fr) 380px]` → `[minmax(0,640px) minmax(0,1fr)]`,
  frame capped `max-w-[600px]`, so the email hugs its content and the info column
  gets more room.
- **Device toggle** (desktop/mobile) in a toolbar above the frame — frame animates
  between `max-w-[600px]` and `max-w-[380px]`.
- **Dark-mode toggle**, shown only when the template ships dark CSS
  (`/prefers-color-scheme:\s*dark/`). `applyScheme()` rewrites the email's
  `prefers-color-scheme` media queries to always/never-match (`min-width:0px` /
  `max-width:0px`) so the toggle is deterministic and works under `sandbox=""`
  (CSS-only, no scripts).
- Copy added (en+es): `viewDesktop`, `viewMobile`, `schemeLight`, `schemeDark`.
- Verified live via SSH tunnel to prod API: desktop/mobile toggle works; dark toggle
  correctly hidden (none of the 13 live templates ship dark CSS yet); `applyScheme`
  rewrite unit-checked. Backend unchanged — Vercel auto-deploy only.
