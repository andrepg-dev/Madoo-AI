# 117 — generate_chart tool (charts in emails via QuickChart → S3)

## Why
Email clients can't run JS/SVG, so charts must be static images. react-email has no chart
component. QuickChart.io renders a Chart.js config to a PNG via URL — verified bar/line/
doughnut all render cleanly with brand colors.

## Backend — `apps/backend/src/generation/generation.service.ts`
- New `GENERATE_CHART_TOOL` (input: `type` bar|line|pie|doughnut|radar|polarArea,
  `labels`, `datasets[{label,data,colors}]`, optional `title`/`width`/`height`). Added to
  the tool list.
- `buildQuickChartUrl()` helper + `ChartToolInput` type + `CHART_PALETTE`. Maps the
  structured input to a Chart.js config (pie/doughnut → per-slice colors; line →
  borderColor + fill:false; bar → backgroundColor), encodes into a
  `quickchart.io/chart?w&h&bkg=white&c=...` URL. Clamps width/height.
- Dispatch branch: builds the URL, rehosts the PNG to our S3 via the existing
  `rehostImageUrl` (stable in inbox/export; falls back to the QuickChart URL if rehost
  fails), emits running/done `tool_call` events (with the image as preview), returns
  `{ chartUrl, type, note }` for the model to use as an `<Img src>`.
- System instruction: CHARTS line — never hand-build charts with divs/SVG; call
  generate_chart and place the PNG as an `<Img>` bound to an image variable.

## Frontend — `apps/client/components/project/editor/ToolCalls.tsx`
- `iconFor("generate_chart")` → `Chart01Icon`. Tool-call card + image preview reuse the
  existing stream handler (same as find_images).

## Verified
- `buildQuickChartUrl`-shaped URL returns `200 image/png`. Backend + client typecheck
  clean.

## Follow-up
- Icons: same constraint (no SVG/font icons in email). Plan a `find_icon`/`generate_icon`
  tool using an icon CDN PNG (e.g. Icons8) rehosted to S3 → `<Img width=20>`. Not built yet.
