---
date: 2026-06-13
area: client (email accessibility testing)
files:
  - apps/client/lib/accessibility.ts
---

# Accessibility check fix: "axe.run arguments are invalid" → realm-correct run

(A pricing-drawer restyle was attempted in the same pass but reverted — the
previous design was preferred.)

## Symptom

Testing modal → Accessibility → Run a Test failed. First with `axe.run
arguments are invalid`, then (after a partial fix) `Could not initialize the
accessibility checker.`

## Cause (cross-realm)

`runAxe` renders the email into a hidden `<iframe>` (`srcdoc`) and called the
**parent's** axe instance with the iframe's `Document`. axe-core 4.12 validates
context via `context instanceof window.Node`, where `window` is the **top**
window. The iframe document is `instanceof iframeWindow.Node`, not the top one,
so `_isContextSpec` returns false, axe shifts its args
(`context`→`options`→`callback`) and throws the TypeError. `setupGlobals` can't
help: the top globals already exist, so it never repoints axe's `window` to the
frame.

Follow-up attempts kept failing for two more reasons, found via the iframe
console:

- **Load-event race:** appending an iframe fires a premature `load` for its
  initial `about:blank` document, so a `{ once: true }` load listener resolved
  *before* `srcdoc` (and axe) had parsed → `frameWindow.axe` undefined.
- **Inline-script corruption:** embedding axe's ~1.3MB source inline in the
  srcdoc threw `Uncaught SyntaxError: Invalid or unexpected token`. axe's source
  contains HTML-like substrings (`<script`, `<!--`, `</style>`, …) that trip the
  HTML parser's script-data escaped states and corrupt the JS — escaping only
  `</script>` is not enough.

More attempts, each surfacing the next failure in the iframe console:

- **`blob:` URL `<script src>`** → failed in Brave (Shields blocks blob/
  opaque-origin script loads).
- **`axe.source` itself is unusable in the browser.** Whether inlined or
  blob-loaded, it threw `Uncaught ReferenceError: exports is not defined` at
  `axeFunction`. Turbopack bundles axe-core as a CJS module, so its stringified
  `axe.source` references `exports`, undefined when run standalone in the frame.
  (The Node `require('axe-core').source` is clean — that mismatch was the trap.)

## Fix (final)

Stop using the bundled `import("axe-core")` entirely. Serve axe-core's prebuilt
**UMD** bundle as a static asset and load it into the frame:

1. `apps/client/scripts/copy-axe.mjs` copies `axe-core/axe.min.js` →
   `public/vendor/axe.min.js`. Wired as `predev` + `prebuild` (and `copy-axe`)
   in `apps/client/package.json`; the file is gitignored.
2. `runAxe` writes the email into a same-origin `about:blank` iframe
   (`open/write/close`), then injects `<script src="${origin}/vendor/axe.min.js">`.
   Same-origin first-party script → no blob, no Brave block, no HTML-parser
   corruption, and the clean UMD self-attaches `window.axe`.
3. `waitForFrameAxe` polls `iframe.contentWindow.axe` (8s, since the external
   script loads async), then `frameAxe.run(frameDocument, …)` runs in the frame
   realm → `instanceof` passes, contrast reads the email's real styles.

Avoids every earlier failure mode: cross-realm arg check, premature load event,
HTML-parser corruption, blob/Brave blocking, and the Turbopack `exports` taint.

Note: `axe-core`'s CJS export has no `.default`, but under Turbopack's ESM
interop `(await import("axe-core")).default` resolves to the axe object (carries
`.source`, ~1.28 MB string).

## Passed / Ignored tabs

The Failed/Passed/Ignored summary pills were static `<span>`s and `runAxe` only
returned counts, so "Passed 15" / "Ignored" weren't viewable. Fixed:

- `runAxe` now returns `passes: AxeCheck[]` and `incomplete: AxeCheck[]`
  (`ignored` = `incomplete.length`); added an `AxeCheck` type (finding minus
  `impact`).
- `AccessibilityPanel` pills are now buttons driving a `tab` state
  (failed/passed/ignored). Failed shows the severity groups; Passed/Ignored show
  a new `CheckList` (rule title, affected nodes, help link), success/neutral
  toned.

## Tuned for email templates (not web pages)

Default axe runs WCAG rules written for full web pages, which false-positive on
emails (the first run flagged "Documents must have `<title>`" and "All page
content should be contained by landmarks"). `runAxe` now passes a `rules`
override disabling the web-only rules that email clients strip or that don't
apply: `document-title`, `html-has-lang`/`html-lang-valid`/`html-xml-lang-
mismatch`, all `landmark-*` + `region`, `page-has-heading-one`, `bypass`,
`frame-*`, `meta-viewport*`/`meta-refresh`, `scrollable-region-focusable`
(`EMAIL_IRRELEVANT_RULES`).

What stays enabled is what actually affects email structure: image alt text,
color contrast, descriptive link text, data-table semantics, heading order,
lists, and ARIA correctness. Deliverability ("buen envío") is intentionally NOT
axe's job — that's the separate Links and Spam tabs.

## Renames

- Testing modal title: "Testing Email Message" → **"Test Email Engine"**.
- Accessibility run button: "Run a Test" → **"Test Engine"** ("Testing…" while
  loading).

## Verify

`npx tsc --noEmit -p apps/client/tsconfig.json` → clean. Run in-app: Test Email
Engine → Accessibility → Test Engine returns email-relevant violations + passes;
the Passed/Ignored tabs are clickable and list their checks.
