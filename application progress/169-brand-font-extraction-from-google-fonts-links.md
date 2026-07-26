# 169 — Extract the brand's real font from Google Fonts links

## Goal
The brand-inspection agent should also capture the **font used on the fetched
page**, not just colors/logo/copy.

## Gap
`WebsiteBrandService.inspect` derived `fonts` only from `extractFonts(styleText)`,
which scans `font-family:` rules in inline `<style>` + the first 3 linked
stylesheets (`collectStyleText` caps at `.slice(0,3)`). Sites that load their
typeface via Google Fonts often:
- put the Google Fonts `<link>` past that 3-stylesheet cap, or
- name the family only in the link URL (`?family=Poppins`), never in a sampled
  `font-family` rule.

Result: the actual brand font was frequently missed.

## Fix
`apps/backend/src/generation/website-brand.service.ts`
- New `extractGoogleFonts(html)`: parses `<link ... fonts.googleapis.com ...>`
  tags, reads every `family=` param (css2 repeats it; css v1 joins with `|`),
  strips the `:wght@...` axis spec, decodes `+`/percent-encoding → family name.
- `inspect()` now returns
  `unique([...extractGoogleFonts(html), ...extractFonts(styleText || html)])`.
  Google Fonts links win (highest confidence — the font the page actually
  loads), CSS `font-family` rules fill in the rest.

Fonts already flow to the model (tool result `JSON.stringify(brandContext)`) and
persist on the workspace brand kit, so no downstream change needed — the agent
just gets a correct font now.

## Verify
- `npx tsc --noEmit` clean in backend.
