# 82 - Home & projects UI adjustments

Batch of client UI tweaks requested for the home showcase and the
`dashboard/projects` library.

## Dashboard project cards (`ProjectLibrary.tsx`)

- Removed the static `Email`/`Template` label row under each grid card.
- Made cards more vertical and matched the home page card height: the
  preview is now `aspect-4/5 min-h-52` (was `aspect-4/3`), the same
  dimensions the home `TemplateCard` uses.

## Home showcase card (`template-card.tsx`)

- Removed the round purple initials avatar to the left of the title.
  Dropped the now-dead `avatarLabel` prop, the `initials` computation,
  and the `28px` grid column; the title/subtitle column is now the only
  child. Updated all three `TemplateCard` call sites in
  `project-show-case.tsx` (projects / templates / community) to stop
  passing `avatarLabel`.

## Prompt box (`ClientPromptBox.tsx`)

- Removed the Tone and Length `Select` controls and all supporting code
  (`promptOptions` const, `promptOptionValues` state, the submit loop
  that set `tone`/`length`, the `Select` import, and the now-unused
  `showOptions` prop). Removed `showOptions={false}` from the chat caller
  in `email-template-project/page.tsx`.

## Home greeting (`(root-layout)/page.tsx`)

- Replaced the hardcoded "Let's craft something, Andre" with the real
  user's first name from the auth store: `user.name` first token, else
  the email local part, else the plain "Let's craft something".

## Verification

- client `tsc --noEmit` passed.
