# 106 — Agent knows about Markdown (chat + react-email component)

## Problem

1. Chat replies render through Streamdown (Markdown), but the prompt never said
   so — the agent wrote flat unformatted text.
2. The compile sandbox injects the FULL @react-email/components catalog as
   globals, which includes `<Markdown>` — the prompt never mentioned it, and
   also didn't forbid inventing unlisted components.

## Changes (generation.prompts.ts)

- Component list now includes `Markdown` and explicitly bans inventing other
  components / raw table-div layouts where a listed component exists.
- `<Markdown>` scoped rule: only for long user-supplied markdown prose
  (articles/changelogs pasted by the user), styled via `markdownCustomStyles`;
  agent-written copy keeps explicit Heading/Text/Button + inline styles.
- CHAT REPLIES rule: replies render as Markdown — short paragraphs, bold key
  changes, compact bullets; never paste TSX/HTML into chat text.

Note: `Tailwind` is also in scope but stays banned (inline styles are the
email-safe practice).
