# 177 — Footer offer panel technique + verified font pairing catalog

Builds on 176 (design technique catalog).

## 1. `footer_offer_panel` technique

Fourth entry in `design-techniques.ts`. Dark high-contrast card between the main
content and the footer, carrying ONE secondary offer (next-order discount,
referral, restock). Reference pattern: arched top via `arc_section_edge`, single
accent color, dashed-border voucher box for the code, one pill CTA, closing line
with accent emphasis.

Key rules baked into the doc:

- Exactly one accent color inside the panel; the filled button is the only solid
  accent block, so the dashed code box is never mistaken for it.
- Panel is deep brand shade, not pure `#000` (bands in dark mode).
- Real footer (unsubscribe, legal) still goes below it, on the light background.
- Explicitly reconciles with the NO ALL-CAPS rule — reference designs of this
  pattern shout in condensed caps; the doc tells the model to get impact from
  size, weight, and color inversion instead.
- Excluded from dark-mode overrides (already dark).

## 2. Font pairing catalog (`font-pairings.ts` + `get_font_pairing` tool)

`<Font>` from react-email emits `src: url(<webFont.url>) format('woff2')`. The
old prompt told the model to write `<Font>` tags itself, so it was inventing
gstatic URLs — which fail *silently*: the email just renders in the fallback and
nothing errors. No `<Font>` usage existed anywhere in the repo to copy from.

Fix: 8 curated pairings with real, checked URLs.

| pairing | display | body |
|---|---|---|
| bold_retail | Anton | Inter 400/700 |
| editorial_serif | Playfair Display | Lora |
| modern_tech | Space Grotesk | Inter 400/700 |
| luxury_minimal | Cormorant Garamond | Jost |
| friendly_consumer | DM Serif Display | DM Sans 400/700 |
| organic_wellness | Fraunces | Karla |
| neo_grotesque | Archivo Black | Archivo 400/700 |
| playful | Baloo 2 | Nunito |

Every URL was resolved from the Google Fonts CSS2 API **latin subset** (the API
returns one `@font-face` per subset — picked the block whose `unicode-range`
covers `U+0000-00FF`) and verified to return `200 font/woff2`.

`renderFontPairing()` builds the paste-ready `<Head>` block from the stored
faces, so the snippet can never drift from the verified URLs. It also carries
three rules the model had no way to know:

1. Never put a `fonts.googleapis.com/css2` stylesheet URL in `webFont` — it
   lands in `src: url(...)` and fails silently.
2. `<Font>` emits a global `* { font-family: ... }`, so the **last** `<Font>`
   tag wins for the whole email. Display first, body last, display family set
   explicitly inline on headings.
3. Headline and body carry **separate** fallback stacks. Caught during
   verification: a single stack meant Gmail (which ignores web fonts entirely,
   i.e. most recipients) rendered Inter body copy as Arial Black, and Jost body
   copy as Garamond.

## Wiring

- `generation.tools.ts` — `GET_FONT_PAIRING_TOOL`, enum bound to the catalog.
- `generation.service.ts` — handler returns `renderFontPairing(pairing)`,
  registered in the tool list.
- `generation.prompts.ts` — the WEB FONTS rule now lists the pairing teasers and
  forbids writing `<Font>` from memory. System-font stacks stay allowed for
  transactional/developer emails (skip the tool, no `<Font>` at all); a
  user-named font outside the catalog gets a system-safe stack, never a guessed
  URL.
- `ToolCalls.tsx` — font icon for the new tool.

## 3. Eval harness + what testing found

`apps/backend/scripts/design-eval.ts` (excluded from the Nest build — tsconfig
includes `src/**/*` only). Runs the real system prompt and tool loop against the
Anthropic API with no Nest/Postgres, stubs `find_images`, compiles the emitted
TSX with the real `ReactToHtmlService`, then checks the rendered HTML: which
tools fired, which `@font-face` families were declared, whether each font URL
actually returns `font/woff2`, and which elliptical radii survived. Run with
`npx ts-node --transpile-only scripts/design-eval.ts`.

Two briefs: a post-purchase confirmation (expects `footer_offer_panel`) and a
flash sale (expects arc + pill + announcement bar).

### Confirmed working

- Both briefs called the right techniques unprompted, and both called
  `get_font_pairing` before writing code — no invented font URLs. Every emitted
  `@font-face` URL returned a real `font/woff2`.
- Anton stayed on headlines with the Arial Black fallback; Inter stayed on body
  with the Helvetica fallback. The split-fallback fix holds end to end.
- Arc, promo pill, announcement bar, and the footer panel all rendered as
  designed. TSX compiled cleanly on every run.

### Defects found by screenshotting, and fixed

- **Unreadable text over the hero photo.** The model cannot see what
  `find_images` returns, so "never overlay text on a busy image" was unfollowable
  — it overlaid a headline on a busy fruit photo. Added a required SCRIM to the
  HERO IMAGE LAYOUT rule and to the arc pattern: stack
  `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))` ahead of the url in the
  same `backgroundImage`. Verified fixed — same photo, legible copy.
- **Light card with light text.** A light "what's in the box" card inside a dark
  email kept the outer light text color and rendered invisible. This was general,
  not technique-specific, so it became a core `SURFACE CONTRAST` instruction:
  text must contrast with its OWN container, and changing a container background
  requires restating every text/border/button color inside it. Verified fixed.

### Known limitations (prose rules the model still ignores)

- **Dark panel inside a dark email.** `footer_offer_panel` now opens with an
  explicit gate and a full PATTERN B (light panel for dark emails), and the model
  still shipped a dark panel in a dark email across two runs. The inversion is
  the technique, so the effect is lost.
- **Dark button on a dark section.** `SURFACE CONTRAST` names this failure
  explicitly and it still occurred.

Both are contrast judgments, and more prose is hitting diminishing returns. The
real fix is deterministic: a contrast check on the emitted component that feeds
the existing validate-and-retry loop in `generation.service.ts` (which already
re-prompts once with validator feedback). Not built — it needs care around false
positives, since a failure there blocks a generation.

## Notes

- Re-run the URL check if a pairing ever renders as its fallback; gstatic paths
  are version-pinned (`/v27/`, `/v40/`) and Google rotates them slowly.
- Not yet deployed to prod.
