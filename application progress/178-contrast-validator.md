# 178 — Deterministic contrast validator

Closes the gap left open in 177: prose rules did not stop the model shipping
invisible content. Two failures survived explicit instructions across multiple
eval runs — a light card inside a dark email keeping the outer light text, and a
near-black CTA on a near-black section. Both are now caught deterministically.

## `src/generation/contrast-audit.ts`

Walks the **React element tree** rather than the rendered HTML. Calling the
compiled component returns the tree with react-email components uninvoked, so
`props.style` is exactly what the model authored and nesting gives the effective
background — no HTML parser, no new dependency (backend has no cheerio/jsdom).

Two checks:

- **text** — resolved text color vs the nearest ancestor background, below
  `2.0:1`.
- **button** — a filled `<Button>`'s own background vs the surface behind it,
  below `1.5:1`, and only when it carries no visible border.

Skipped rather than guessed: any subtree under a `background-image` or gradient
(unknown backdrop, and this is where the hero scrim lives), `Preview`/`Head`/
`Font`, `display:none` / `opacity:0` / `font-size:0` blocks, and any color it
cannot parse. Findings are de-duplicated per color pair — one palette mistake is
one fix, not a wall of identical lines.

### Threshold calibration

Deliberately far below WCAG. This is not an accessibility linter and must never
police design, because a false positive costs a full extra generation round-trip.
It only catches the effectively invisible:

| case | ratio | verdict |
|---|---|---|
| white on `#F2EDE4` (the shipped bug) | 1.11 | caught |
| `#1A1A1A` on `#141414` (the shipped bug) | 1.06 | caught |
| muted `#999` footer on white | 2.85 | passes |
| `#B0B0B0` label on `#141414` | 8.9 | passes |

`auditContrast` never throws — any unexpected component shape yields no
findings. An auditor that can break a generation is worse than one that misses.

## Wiring

In the existing validate-and-retry loop in `generation.service.ts`, right after
`compile()` succeeds. Findings on attempt 1 throw, which routes into the retry
that was already there (it re-prompts once with `Reason:` feedback). **Only on
attempt 1** — a second offending draft is accepted, so a contrast finding can
never be the reason a generation fails.

## Tests

`src/generation/contrast-audit.spec.ts`, 14 cases, registered in the backend
`test` script (project uses `node --test`, not jest). Covers both shipped bugs,
color parsing, inheritance, the scrim/preheader/muted-gray exemptions, dedup,
and the never-throws guarantee.

Found and fixed one real bug while writing them: `componentName` only handled
strings and functions, but react-email ships every component as a **forwardRef
object** with a `displayName`. Both the `Button` check and the `Preview` skip
were silently dead until that was handled.

## Verified end to end

Forced the exact defect through the real loop: 3 findings detected, fed through
`formatContrastFeedback`, model returned corrected TSX, re-audit clean, and the
screenshot confirms the card text flipped dark and the button flipped white.

A normal eval run of both briefs now reports `contrast: clean` on the first
attempt, so the retry does not fire on healthy output.

## Notes

- `npm test` also reports one **pre-existing** failure in
  `src/billing/credit-window.spec.ts` — it comes from the uncommitted free-plan
  bump in `packages/shared/src/billing.ts` (`aiGenerations: 3 -> 30`), unrelated
  to this work.
- Not yet deployed to prod.
