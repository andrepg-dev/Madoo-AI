# 111 — Teach the email AI to build responsive emails

## Problem
Generated emails had no real mobile responsiveness. The system instruction only said
multi-column layouts should "collapse gracefully on mobile" — no concrete technique.
Inline styles (the house style) cannot carry media queries, so emails did not adapt on
small screens.

## Change
`apps/backend/src/generation/generation.service.ts` — added a new RESPONSIVE line to
`STATIC_INSTRUCTION` (right after the multi-column rule). It tells the model to:

- Put a `<style>` block inside `<Head>` with an
  `@media only screen and (max-width: 600px)` rule.
- Add `className` hooks to the elements that must change (e.g. `headline`, `hero-img`,
  `section-pad`, `col-feature`) so the rule can target them.
- Use `!important` inside the media query (must beat inline styles).
- Keep the desktop look in inline `style`; only override on mobile: reduce padding,
  images `width:100% max-width:100%`, shrink headline font-size, stack `<Column>`s with
  `display:block width:100%`.

Example pattern embedded in the instruction matches the one provided by the user.

## Why it works
Renderer (`react-to-html.service.ts`) uses `@react-email/components` +
`renderToStaticMarkup`. `<Head>` accepts a `<style>` child and all components pass
`className` through, so the media query and class hooks survive into the final HTML.

Prompt-only change — no schema/frontend changes.
