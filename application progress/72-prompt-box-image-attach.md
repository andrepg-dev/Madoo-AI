---
date: 2026-06-14
area: email-template-project (ClientPromptBox image attach)
files:
  - apps/client/components/home/ClientPromptBox.tsx
  - apps/client/app/email-template-project/page.tsx
---

# Prompt box image attach — Plus dropdown

## Goal

In `ClientPromptBox` the Plus (`Add01Icon`) button was dead. Make it open a
dropdown to attach images, with thumbnail previews inside the box.

## Scope (UI + collect)

Frontend only. Images are gathered in component state and forwarded on
`PromptSubmitInput.images`. No backend/model wiring yet — the AI generation does
not consume the images (the existing `/emails/{id}/images` endpoint needs an
`emailId` and is for image-role variables, not prompt context).

## Implementation

- Plus button now wraps the design-system `Dropdown` (controlled via
  `attachMenuOpen`). `DropdownContent side="top"` so it drops up from the action
  bar. Items: **Upload image** (`Image01Icon`) and **Take photo**
  (`Camera01Icon`).
- Two hidden `<input type="file" accept="image/*">` — the multiple picker and a
  `capture="environment"` camera input. Dropdown items `.click()` the refs.
- Selected files filtered to `image/*`, stored as `PromptImage { id, file, url }`
  with `URL.createObjectURL` previews. Thumbnail row (14×14, rounded) rendered
  between textarea and controls, each with a `Cancel01Icon` remove button.
- Object URLs revoked on remove, on submit (`resetImages`), and on unmount
  (via `imagesRef`). File input value reset after change so re-picking same file
  fires `onChange`.
- `submitPrompt` sets `input.images` when present; cleared after `onSubmit` and
  before the home→project navigation (Files can't survive a URL navigation).

## Chat bubble display

- Preview moved above the textarea (floats at top of the box).
- `submitChatPrompt` turns `input.images` (`File[]`) into object URLs and stores
  them on the new `ChatMessage.images?: string[]`. `HumanMessage` renders them as
  20×20 thumbnails above the text bubble, right-aligned.

## Notes

- Send still gated on prompt text (`hasPrompt`); image-only send not allowed.
- Display-only / session-local: images are not persisted to the backend, so they
  vanish on reload and are not yet fed to the AI generation.

## Verify

`tsc --noEmit` clean for apps/client.
