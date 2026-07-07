# 109 — Phone preview scroll fix + cliché greeting headline ban

## Problems

1. Full-screen preview, Phone mode: the fixed 760px bezel sat in a
   vertically-centered container with no overflow — on short viewports it
   slid up under the Desktop|Phone toggle and the top was unreachable.
   Desktop mode was fine (its frame is h-full).
2. The agent constantly opened emails with "Hey {{recipientName}}, welcome to
   [Brand]." — the most generic email-template headline pattern, across all
   email types.

## Changes

- `DeviceFramePreview.tsx` (client): scroll container gets `overflow-y-auto`;
  the phone wrapper drops `flex h-full items-center` so the bezel top-aligns
  under the toggle and scrolls when taller than the viewport. (Implemented via
  builder subagent; diff reviewed.)
- `generation.prompts.ts` (backend, deployed to VPS): new NO CLICHÉ GREETING
  HEADLINES rule — no "Hey {name}, welcome to X" / "Welcome to X" / "Welcome
  aboard" headlines on ANY email type; headlines lead with the specific
  message/value; greetings allowed only as a body salutation line; welcome
  emails welcome through concrete value.

## Verify

Phone preview on a short window: toggle stays visible, frame scrolls. New
generations: headline never a greeting formula.
