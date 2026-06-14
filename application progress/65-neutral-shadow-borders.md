---
date: 2026-06-14
area: design tokens (shadow-border color)
files:
  - packages/design-system/src/tokens/tokens.css
  - apps/client/app/globals.css
---

# Shadow-borders neutral, never blue

User: shadow-borders that rendered blue look bad — make them dark/neutral like
the rest.

## Cause

`--rule` / `--rule-rgb` (the rule/border color) were the brand blue
(`#2f6fea` / `47 111 234`). Every rule-based ring used it — `--shadow-border-
rule(-hover)`, `madoo-paper-border`, and `rgb(var(--rule-rgb) / …)` in Card,
Checkbox, Select, and several client pages — so those borders read blue. The
client's `.madoo-paper-border` also hardcoded `rgb(47 111 234 / 0.12)`.

## Fix

- `tokens.css` `:root`: `--rule` → `#101114`, `--rule-rgb` → `16 17 20`
  (the same neutral ink already used by `--ink-shadow-rgb`). All rule-based
  shadow-borders are now neutral ink at their existing low alphas.
- `tokens.css` `[data-theme="midnight"]`: added `--rule`/`--rule-rgb` = white so
  rule borders stay visible on dark surfaces.
- `apps/client/app/globals.css` `.madoo-paper-border`: hardcoded blue →
  `rgb(var(--rule-rgb) / 0.12)` (token-driven, theme-aware).

`--link` and `--accent` stay blue (those are links/accents, not borders).
`tokens.css` is exported from `src`, so no design-system build needed.
