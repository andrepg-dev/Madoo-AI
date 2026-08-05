# 176 — Design technique catalog (opt-in, tool-fetched)

## Problem

The generator never produced certain art-directed moves — e.g. the curved
("swoosh") boundary between a full-bleed photo hero and the section under it.
Adding those recipes to `STATIC_INSTRUCTION` would make the model reach for them
on every email, which is exactly the sameness the ANTI-SLOP rule fights.

## Approach

Split "the technique exists" from "here is how to build it":

- The system prompt carries a one-line index of technique names.
- The full recipe lives behind a new `get_design_technique` tool, fetched only
  when a brief, brand, or attached reference actually calls for it.

## Changes

- `apps/backend/src/generation/design-techniques.ts` (new) — catalog. Each entry
  has `name`, a one-line `teaser` for the prompt index, and a `doc` with: when
  to use / when not to, a copy-pasteable email-safe pattern, hard rules, and the
  Outlook Windows fallback. Seeded with three:
  - `arc_section_edge` — elliptical `border-radius` arc painted in the *next*
    section's color. Two patterns: background-image hero (arc block nested in
    the hero, no negative margins) and plain `<Img>` hero (self-clipping).
    Outlook ignores radius → flat band in the next section's color, reads as
    spacing, not as a defect.
  - `promo_code_pill` — inline `<span>` chip for a discount code inside a
    sentence.
  - `top_announcement_bar` — thin full-width strip above the header.
- `generation.tools.ts` — `GET_DESIGN_TECHNIQUE_TOOL`, name enum bound to the
  catalog so an unknown id cannot be requested.
- `generation.service.ts` — tool registered in the tool list, handler returns
  `technique.doc` as the tool result and emits a `tool_call` event.
- `generation.prompts.ts` — `DESIGN TECHNIQUE CATALOG` instruction: lists the
  teasers, requires fetching before use, states plainly that these are not
  defaults (most emails use none).
- `apps/client/.../ToolCalls.tsx` — paintbrush icon for the new tool.

## Notes

- SVG and pre-baked curve PNGs were rejected: Gmail strips SVG, and a baked
  curve locks the color away from the brand palette.
- Adding a technique = one entry in `DESIGN_TECHNIQUES`. Prompt, tool enum, and
  index update themselves.
- Not yet deployed to prod.
