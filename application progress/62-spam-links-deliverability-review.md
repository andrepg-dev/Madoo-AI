---
date: 2026-06-14
area: testing (Spam + Links deliverability review)
files:
  - apps/backend/src/testing/testing.service.ts
  - apps/client/components/project/testing/LinksPanel.tsx
---

# Spam + Links review for "buen envío" (deliverability)

Reviewed both tabs against email deliverability/QA. Both are real (no stubs) and
mostly solid.

## Links — solid

`checkLinks` extracts every `<a href>` (deduped), classifies http/mailto/tel/
anchor, and probes http(s) with HEAD→GET fallback, follows redirects, 6s
timeout, max 25 links. Flags broken (status ≥ 400 / unreachable / timeout) and
missing UTM params. Good coverage.

**Placeholder links now flagged broken:** `probeLink` marks bare `href="#"` and
`javascript:` stubs as `ok: false` with error "Placeholder link" (common
template leftovers that go nowhere) — they now count toward `broken`. The panel
badge was reworked to show the failure reason for any non-OK link (not just the
link `kind`), and the "No UTM" warning only shows on OK http links.

Remaining soft spots (left as-is): no non-https flag; server-side probes can get
false "broken" from bot-blocking sites (HEAD→GET mitigates).

## Spam — good heuristics, added two template-level gaps

Existing checks: spam trigger words, subject shouting (caps), exclamation count,
unsubscribe link, image-to-text balance, image alt text, link count, subject
length. Score = 100 − penalties (high 22 / medium 12 / low 6).

Added two high-value, template-level deliverability checks:

- **`html-size`** (medium): flags HTML > ~102KB, where Gmail clips the message —
  hiding content and the unsubscribe link. Common and easy to miss.
- **`risky-elements`** (high): flags `<script>`/`<form>`/`<iframe>`, which email
  clients strip and which raise spam scores.

Both are additive — the panel renders `result.issues` dynamically, and the
shared `SpamIssue` schema already allows any `id`, so no contract/UI change.

## Out of scope (correctly not checked)

SPF/DKIM/DMARC are **domain/DNS-level** auth, not properties of the template
HTML — they belong to the sending domain/provider config, not the email engine's
per-template tests. Same for true plain-text MIME part (a send-time concern).
