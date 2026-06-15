---
date: 2026-06-14
area: generation (LLM prompt — variable scope for URLs)
files:
  - apps/backend/src/generation/generation.service.ts
---

# URL variables default to static, not dynamic

## Change

The generation system prompt (`STATIC_INSTRUCTION`) used to push URL variables
toward `scope=dynamic` (it listed `ctaUrl` and `unsubscribeUrl` as dynamic
examples). That made every CTA/link a dynamic merge field even though the
destination is the same for every recipient.

New guidance:

- `ctaUrl` and content/store/landing/social links → `scope=static`.
- A dedicated rule: links/URLs are generally NOT dynamic; a `role=url` variable
  defaults to `scope=static`. Use `scope=dynamic` for a URL only when the sending
  platform injects a per-recipient value — primarily `unsubscribeUrl` (and
  per-recipient tracked links if the user explicitly asks).
- Removed `ctaUrl` from the dynamic-examples line; `unsubscribeUrl` stays dynamic.

## Verify

`tsc --noEmit` clean for apps/backend.
