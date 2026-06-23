# 108 — Home prompt-box images now reach the AI

## Problem
Attaching/pasting an image in the **home** prompt box and clicking "Generate
email" never sent the image to the model. The AI replied "you didn't attach any
image". Root cause: the home flow navigates to the project page by putting only
the `prompt` in the URL — `File` objects can't ride a URL, so `submitPrompt`
called `resetImages()` and dropped them. The project page then generated from
text only (`startStream(created.id, "generate")` with no `imageUrls`).

(The in-project **chat** box was already correct — it uploads to S3 via
`uploadEmailImage` and passes `imageUrls` to `startStream`, which the backend
turns into Anthropic vision blocks in `buildUserMessageContent`.)

## Fix
Hand the attached files across the client-side navigation through the Zustand
store instead of the URL.

- `apps/client/stores/client-store.ts`: added in-memory `pendingPromptImages`
  with `setPendingPromptImages` and `consumePendingPromptImages` (returns +
  clears).
- `apps/client/components/home/ClientPromptBox.tsx`: in the navigate (no
  `onSubmit`) branch, stash `input.images` via `setPendingPromptImages` before
  `router.push`.
- `apps/client/app/email-template-project/page.tsx`: the `prompt`-param startup
  branch now consumes the pending images, shows them as previews on the user
  message, uploads each via `uploadEmailImage(created.id, ...)`, and passes the
  resulting URLs to `startStream(created.id, "generate", undefined, undefined,
  uploaded)`. Backend `runInitial` already attaches `imageUrls` as vision blocks.

Unauthenticated home submit still redirects to landing auth (login flow drops
the files — out of scope).

## Files
- `apps/client/stores/client-store.ts`
- `apps/client/components/home/ClientPromptBox.tsx`
- `apps/client/app/email-template-project/page.tsx`

## Verify
- `npx tsc --noEmit -p apps/client/tsconfig.json` — clean.
- Manual: on home, paste/attach an image, type a prompt, Generate → project page
  shows the image on the user message and the AI references/uses it.
