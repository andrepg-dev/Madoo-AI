# 141 — Landing: Test Email Engine + Time Saving illustrations, CTA swap

## Changes

Continuation of 140 (same Codex image-brief formula: paper-cutout editorial
illustration, palette #f8fafc / #101114 / #8b5cf6, no readable text).

- **Test Email Engine tab**: new `/product/test-email-engine-hero.webp`
  (60 KB) — same email verified with violet checkmarks across desktop,
  tablet, and phone, magnifier detail. Replaced and deleted
  `client-compatibility.png`.
- **Time Saving & Automation tab**: new `/product/time-saving-hero.webp`
  (36 KB) — prompt bubble → bolt → finished email landing in an inbox tray,
  stopwatch above. Replaced and deleted `prompt-to-inbox-flow.png`.
- **Feature-section CTA**: "Get started free" → "See examples" (es: "Ver
  ejemplos"); button is now an anchor to `#templates` (the community
  templates gallery on the same page) instead of the auth-dialog button.

Both PNGs from Codex were converted to 1024×1024 webp with sharp and the
originals removed.

## Verification

- Inspected both generated images: on-brief, consistent visual family.
- `tsc --noEmit` clean in apps/landing.

## Deploy

Pushed to main; Vercel auto-deploys `madoo-ai-frontend`.
