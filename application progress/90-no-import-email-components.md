# 90 — Generated email code no longer needs imports

## Premise check
User assumed the compiler already injected the email components, so the LLM
shouldn't need to know about `@react-email`. That was **false**: the compiler
only transpiled the LLM's `import { Body, … } from '@react-email/components'`
(via `@babel/plugin-transform-modules-commonjs`) into a `require`, resolved by
`sandboxRequire`. Only `React` was a VM global; `Body`/`Container`/etc. came
solely from the model-written imports. Removing the import instruction without a
compiler change would have produced `Body is not defined` at runtime.

## Change — make the premise true
### `apps/backend/src/generation/react-to-html.service.ts`
- `require("@react-email/components")` once, then spread all its named exports
  into the VM context (`...reactEmail`) so generated code can use `<Body>`,
  `<Container>`, `<Text>`, … as globals with **no imports**.
- Kept the `require` resolver (`react` + `@react-email/components`) for backward
  compatibility with existing variants and seed templates that still import.

### `apps/backend/src/generation/generation.service.ts`
- `STATIC_INSTRUCTION`: replaced the "import React + import components" line with
  "Do NOT write any import statements — React and all email components are
  already available in scope" + the usable tag list.
- `FEW_SHOT_TEXT`: added `stripImports()` to remove import lines from the
  launch/newsletter/sale/welcome examples so the few-shot matches the rule.
  (Strips only the displayed examples; `SEED_TEMPLATES` data is untouched.)

## Verification
- `tsc --noEmit` backend: clean.
- Runtime: import-free component compiles + renders + variables resolve (2603
  chars, var injected). Legacy component WITH imports still compiles. Both paths
  pass.
