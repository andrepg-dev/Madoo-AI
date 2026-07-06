# 100 — Anti-Generic Email Design Overhaul

## Problem

AI-generated templates looked generic: every email shared the same skeleton
(header → eyebrow → headline → CTA → footer), the same 4 few-shot references,
forced `borderRadius: 0`, a no-emoji ban, system-font defaults, and the model
never saw its own rendered output. Model was the deprecated
`claude-sonnet-4-20250514`.

## Changes (backend only)

### Model + effort (generation.service.ts, .env)
- Default model → `claude-sonnet-5` (env `ANTHROPIC_MODEL` also updated locally;
  **prod env must be updated manually on next deploy**).
- `max_tokens` raised 20k/16k → 32k/24k (Sonnet 5 tokenizer ~30% heavier).
- Effort routed per run kind: INITIAL → `high`, EDIT → `medium`. Overrides:
  `ANTHROPIC_EFFORT_INITIAL`, `ANTHROPIC_EFFORT_EDIT`, then `ANTHROPIC_EFFORT`.

### Vision feedback loop
- New `view_current_email` tool: renders latest (or version N) variant, returns
  PNG screenshot (height-clipped at 2400px via new `maxHeight` option in
  ScreenshotService) as an image block in the tool result. Prompted to use it
  on look complaints / reference matching / big redesigns — not every turn.
- Optional self-review pass (`GENERATION_SELF_REVIEW=true`, default OFF): after
  an INITIAL draft, model sees its own rendered screenshot and may emit one
  improved revision (saved as a normal next variant).

### Prompt rewrite (generation.prompts.ts)
- Fixed skeleton + fixed type scale replaced by DESIGN DIRECTION (commit to a
  concrete spec first) + 8 LAYOUT ARCHETYPES (hero, editorial, bold promo,
  product grid, dark luxury, event card, minimal note, stats digest).
- `borderRadius: 0` and no-emoji now brand-conditional, not universal law.
- NEW RULE: every email must include at least one meaningful image (beyond the
  logo) bound to an image variable — unless the user explicitly opts out.
- Typography flipped: distinctive Google font via <Font> is the default for
  marketing emails; system stacks reserved for transactional/dev emails.
- ANTI-SLOP rule added; SEEING YOUR WORK rule references the new tool.

### Few-shot selection (generation.prompts.ts)
- `FEW_SHOT_TEXT` (always launch/newsletter/sale/welcome) → `buildFewShotText(brief)`:
  deterministic boundary-aware keyword scoring over all 12 seed templates, top-2,
  padded with launch+newsletter. Keyed off the email's stored brief so selection
  is stable per conversation (prompt cache survives).

### Workspace brand kit persistence
- New Prisma model `WorkspaceBrandProfile` (1:1 Workspace, cascade delete):
  url, brandName, logoUrl, colors, fonts, copyTone, imageUrls, raw.
- Upserted fire-and-forget after each successful `inspect_website_brand`.
- Injected as a compact (<600 char) block into the volatile user prompt of both
  initial and edit runs.

## Migration status

`prisma/migrations/20260706000000_workspace_brand_profile/` — SQL handwritten
(local Docker/Postgres was down; `prisma migrate dev` could not run). Prisma
client regenerated. Prod applies it automatically (`migrate deploy` on boot).
Locally: run `npx prisma migrate deploy` (or `migrate dev`) once the DB is up.

## Verification

- `npx tsc --noEmit` clean; `npx prisma validate` clean.
- Few-shot selection unit-tested ad hoc: sale/newsletter/webinar/win-back/survey
  briefs each pick matching templates; unmatched briefs get the default pair;
  substring false positives ("office"→sale) eliminated with boundary regex.
- Live end-to-end generation NOT run (local DB down). Verify after next
  `docker compose up`: create an email with a brand URL, confirm brand profile
  row, distinct design directions across briefs, image present by default, and
  `view_current_email` usable after a "make it look better" instruction.

## Follow-ups

- Set `ANTHROPIC_MODEL=claude-sonnet-5` in prod backend env at next deploy.
- Consider enabling `GENERATION_SELF_REVIEW=true` after observing cost.
- Optional next step: brand kit management UI in apps/client (view/clear).
