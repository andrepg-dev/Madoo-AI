# 107 — Bidirectional dark/light scheme (dark-by-design emails)

## Problem

Dark-by-design emails (dark base in inline styles, e.g. dev-brand templates)
ignored the Light toggle: the prompt only vaguely asked for "light overrides"
without a mechanism, and the preview toggle only rewrote the
`prefers-color-scheme: dark` media query — a `light` block was left to the
viewer's OS.

## Changes

- Prompt (backend, deployed to VPS): every email must adapt BOTH directions —
  light-base emails carry the dark block; dark-base emails must carry an
  `@media (prefers-color-scheme: light)` block (same className hooks +
  `!important`) flipping to a light presentation.
- Preview (client): the toggle now rewrites both media queries — the selected
  scheme's block is forced on (`@media all`), the other forced off
  (`@media not all`).

Existing variants generated before this rule lack the light block — regenerate
or edit ("make it adapt to light mode") to pick it up.

## Verify

Dark-by-design email → Light toggle flips it to a light presentation; Dark
returns it. Light-base email unchanged behavior.
