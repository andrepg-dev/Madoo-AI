# 120 — Expose Heading, Font, CodeBlock, CodeInline to the agent

## Context
`@react-email/components@1.0.12` ships more components than the agent was told about. The
runtime (`react-to-html.service.ts`) already injects the WHOLE package as globals
(`...reactEmail`), so any component renders — but the system prompt listed only 13 tags,
so the LLM never used the rest.

## Change — `apps/backend/src/generation/generation.service.ts` (prompt only)
Added to the allowed-tag list + guidance in `STATIC_INSTRUCTION`:
- **Heading** — semantic h1–h6 via `as`, for real heading structure (was faking headings
  with `<Text>`). Still styled inline.
- **Font** — web/Google fonts via `<Font>` in `<Head>` with a required
  `fallbackFontFamily` (many clients ignore web fonts).
- **CodeBlock** / **CodeInline** — only for developer/changelog/API emails.
  `<CodeBlock code language theme={dracula} />`; theme must be an in-scope global
  (dracula, atomDark, oneDark, oneLight, nord) — confirmed exported from the package.

Skipped: **Tailwind** (house style is inline styles) and **Markdown** (not needed now).

## Verified
- Runtime globals exist: CodeBlock, CodeInline, Heading, Font, and the named themes.
- `renderToStaticMarkup` of Heading/Font/CodeBlock/CodeInline emits `<h1>`, `@font-face`,
  `<code>`, `<pre>` correctly.
- Backend typecheck clean. No frontend / schema changes.
