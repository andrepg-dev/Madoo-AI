---
date: 2026-06-13
area: email-template-project (testing, share, chat)
files:
  - packages/shared/src/testing.ts
  - apps/backend/src/testing/testing.service.ts
  - apps/backend/src/testing/testing.controller.ts
  - apps/client/actions/testing.ts
  - apps/client/components/project/testing/LinksPanel.tsx
  - apps/client/components/project/testing/SpamPanel.tsx
  - apps/client/components/project/testing/TestingModal.tsx
  - apps/client/components/project/share/AccessLevelSelect.tsx
  - apps/client/components/home/ClientPromptBox.tsx
  - apps/client/app/email-template-project/page.tsx
---

# Testing panels, share roles, optimistic chat + step timeline

Second pass on the email project after the share/preview/chat fixes.

## Links + Spam testing are now real

Were "Soon" stubs. Implemented end to end:

- **shared:** `LinkCheck`/`TestLinksResponse` and `SpamIssue`/`TestSpamResponse`.
- **backend (`testing.service`):**
  - `checkLinks` extracts every `<a href>` from the latest variant's compiled
    HTML, classifies it (http/mailto/tel/anchor), and probes http links with a
    HEAD→GET fallback and a 6s timeout (cap 25). Reports status, reachability,
    and missing-UTM flags.
  - `checkSpam` runs deterministic heuristics (trigger words, shouting subject,
    punctuation, unsubscribe link, text/image balance, alt text, link count,
    subject length), returns a 0–100 score + rating + per-check pass/fail.
  - `POST /emails/:id/test/links` and `POST /emails/:id/test/spam` (guarded).
- **client:** `testEmailLinks`/`testEmailSpam` actions; `LinksPanel` and
  `SpamPanel` replace `SoonPanel` in the testing modal. Accessibility (Axe) was
  already real and is unchanged.

## Share popover: project access roles

Added the access-level picker from the design (Admin · Pro / Can edit / Can
view · Pro) as `AccessLevelSelect`, alongside the public/private link. The two
Pro tiers are gated — selecting one opens pricing instead of applying. Inline
expand avoids nesting a second popover inside the share dropdown.

## Chat: optimistic send + persistent step timeline

- **Optimistic send:** the prompt box clears immediately and the user message is
  rendered before the backend save round-trips (no wait-for-DB lag).
- **Step timeline:** generation steps (preparing, inspecting brand, writing the
  template, rendering, screenshot, preview ready) used to overwrite one status
  line and vanish on completion. They now accumulate into a `timeline` chat row
  that animates live, then collapses to "Worked for Ns" and **stays in the
  conversation**. Client-only timeline/error rows survive the post-stream chat
  refetch via a seq-ordered merge keyed by email id.

## Verification

- `@madoo/shared` rebuilt; `tsc --noEmit` passes for backend and client.
- Live link probing and Resend inbox send still depend on network/env at runtime.
