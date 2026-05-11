# 42 — Responsive web

Make the whole frontend usable on mobile / tablet / desktop.

## Scope
Whole `apps/frontend` (no marketing-only carve-out). Target breakpoints: mobile + tablet + desktop using existing CSS conventions (inline styles + `globals.css`). No Tailwind in this app.

## Audit
Investigator agent mapped ~40 non-responsive offenders across:
- `apps/frontend/components/shell` (AppShell, Sidebar, TopBar, CommandPalette)
- `apps/frontend/components/{analytics, campaigns, contacts, domain, home}` screens
- `apps/frontend/components/campaigns/{ComposeModal, CampaignDetailModal}`
- `apps/frontend/components/home/EditorScreen`
- `packages/ui/src/components/Modal/Modal.css`
- `packages/ui/src/components/Toast/Toaster.css`

## Changes

### Foundation
- `apps/frontend/app/layout.tsx` — added explicit `viewport` export (`width=device-width, initial-scale=1, viewportFit=cover`).
- `apps/frontend/app/globals.css` — added responsive utility classes:
  - `madoo-screen-pad` (fluid screen padding)
  - `madoo-grid-metrics` (4 → 2 → 1 col)
  - `madoo-grid-two` (2 → 1 col)
  - `madoo-grid-label` (label/value rows)
  - `madoo-table-scroll` (overflow-x wrappers for wide tables)
  - `madoo-sidebar-backdrop`, `madoo-mobile-only`, `madoo-desktop-only`
  - `madoo-home-hero` / `madoo-home-recent` / `madoo-home-templates`
  - `madoo-campaign-row`, `madoo-analytics-row`, `madoo-dns-row`
  - `madoo-contacts-header`, `madoo-editor-aside`, `madoo-editor-shell`
  - `madoo-compose-cols`
  - Generic `img/svg/video { max-width: 100% }`.

### Shell
- New `apps/frontend/stores/sidebar.ts` (zustand) for mobile drawer state.
- `AppShell.tsx` — switched `100vh` → `100dvh`, added drawer backdrop and pathname-based auto-close.
- `Sidebar.tsx` — now an off-canvas drawer below 900px (transform translateX, backdrop click closes).
- `TopBar.tsx` — added hamburger toggle (`madoo-mobile-only`) wired to sidebar store; workspace breadcrumb gets `minWidth: 0` so it can shrink.
- `CommandPalette.tsx` — added 16px horizontal padding so palette no longer touches edges on phones.

### Screens
- `AnalyticsScreen.tsx` — `madoo-screen-pad` + `madoo-grid-metrics`; header `flexWrap: wrap`; analytics row collapses 4-col to 2-col below 760px.
- `CampaignsScreen.tsx` — `madoo-screen-pad`; metrics grid responsive; campaign row 6-col collapses to single column below 1100px.
- `ContactsScreen.tsx` — segments aside hidden on mobile (`madoo-desktop-only`); header padding scales down; contacts table wrapped in `madoo-table-scroll` with `minWidth: 720` so it scrolls horizontally; filter row `flexWrap: wrap`; Add-contact form 2-col → 1-col below 640px.
- `DomainScreen.tsx` — `madoo-screen-pad`; DNS records grid collapses to single column below 700px; DNS header hidden on mobile.
- `HomeScreen.tsx` — section paddings replaced with `madoo-home-*` classes that scale at 900 / 600 px; hero h1 fontSize uses `clamp(32px, 7vw, 52px)`.

### Modals
- `packages/ui/src/components/Modal/Modal.css` — below 640px modals slide up from bottom edge (overlay padding 12px, full-width, rounded top corners); footer wraps.
- `packages/ui/src/components/Toast/Toaster.css` — toaster stretches edge-to-edge below 480px; toast `min-width` clamps to viewport.
- `ComposeModal.tsx` — `1fr 280px` two-column block collapses below 760px; schedule cards 2 → 1 col; review summary uses `madoo-grid-label`.
- `CampaignDetailModal.tsx` — detail rows use `madoo-grid-label`.
- `EditorScreen.tsx` — right aside (390px) stacks under main editor below 900px (`madoo-editor-shell` flex-direction column, aside `max-height: 60vh`).

## Verification
- `pnpm exec tsc --noEmit` from `apps/frontend` — passes.
- Manual responsive sweep not executed in this session (no dev server).

## Follow-ups
- TemplatePreviewScreen, ErrorScreen, GeneratingScreen — currently using `maxWidth` with implicit `width: 100%`; already shrink correctly, but padding could still be tightened on phones if needed.
- Segments aside is fully hidden on mobile contacts; a future pass should expose it via a dedicated drawer.
- Settings routes were not audited explicitly.
