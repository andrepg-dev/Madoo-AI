# 179 — Composer skill picker (user-selected design skills)

Builds on 176/177. Those made design techniques and font pairings *available* to
the model behind tools; this lets the **user** choose them in the composer, and
loads the full recipes into the very first request instead of hoping the model
decides to fetch them.

## Contract

- `packages/shared/src/skills.ts` (new) — `SkillDto` (`name`, `kind`, `label`,
  `summary`), `SkillListSchema`, `PromptSkillsSchema`, `MAX_PROMPT_SKILLS = 3`.
- `skills` added to `GenerateEmailSchema` and `EditEmailSchema`.

## Backend

- `skills.catalog.ts` (new) — `listSkills()` merges `DESIGN_TECHNIQUES` +
  `FONT_PAIRINGS` into picker rows (12 total: 4 techniques, 8 pairings), and
  `buildSkillPreamble(names)` renders the selected recipes into a system block.
  Unknown ids are dropped, never rejected, so a stale client cannot fail a
  generation.
- `skills.controller.ts` (new) — `GET /api/v1/skills`, `JwtAuthGuard` only (the
  catalog is static, no workspace scoping). Registered on `GenerationModule`,
  which now imports `AuthModule` for the guard.
- `generation.service.ts` — `skills` threaded controller → `generateEmailStream`
  / `editEmailStream` → `runInitial` / `runEdit` → `executeAnthropicTurn`. The
  preamble is pushed as a **third** system block, after the two cached ones, so
  the cached prefix stays byte-identical and only the varying block is uncached.

## Client

- `actions/skills.ts` (new) — `fetchSkills()` via `FetchWrapper`.
- `ClientPromptBox.tsx` — "Skills" dropdown beside the attach button: multi-select
  rows with label + summary, a tick for selected, hard cap at 3 with the
  remaining rows disabled. Selected skills render as removable chips above the
  textarea and clear after send. The menu stays open while picking because
  `DropdownItem` only closes when the click default is *not* prevented — so the
  toggle runs on `onClick` with `preventDefault()`, not `onSelect`.
- `page.tsx` — `skills` flows through `startStream` into the generate/edit body.
  A generate turn now sends a body when skills are present even with no prompt
  text or images.

## What testing found

Ran a B2B SaaS product-update brief — a case that would never trigger any of
them — with `arc_section_edge`, `top_announcement_bar` and `playful` selected.

Two prompt bugs, both found this way and both fixed:

1. **The model dropped the skills.** Every recipe carries its own "WHEN TO USE /
   DO NOT use it when…" gate, written for when the *model* is choosing. The
   model read "do not use on transactional/B2B", agreed, and silently omitted
   the skill. The preamble now states explicitly that the selection overrides
   each recipe's suitability gate (and the base prompt's system-font rule for
   transactional email), while every other part of the recipe still applies.
2. **The arc had nowhere to live.** Structural techniques attach to a layout
   feature; the model kept its own layout, found no full-bleed image band, and
   omitted the arc. The preamble now tells it to build the structure the skill
   needs and pick an archetype that accommodates every selected skill.

Final run: all three skills applied, real gstatic font URLs, contrast clean.

**Harness caveat worth remembering:** intermediate runs looked erratic because
the eval forced `tool_choice: emit_email`, which also disables extended
thinking — not how production runs. Switching the harness to `auto` (production
config) made compliance consistent. Measure against the real config or the
numbers are noise.

## Notes

- Not yet deployed to prod.
