# 114 — Email version history via a tool (get_email_version)

## Why
The edit agent only ever saw the CURRENT version's TSX, so requests like "put the image
back as it was in version 1" / "revert as before" had no real source to revert from — it
guessed from memory. Dumping every past version into context would bloat the prompt. A
lazy tool gives the agent on-demand access to any prior version without overwhelming
context.

## Backend — `apps/backend/src/generation/generation.service.ts`
- New `GET_EMAIL_VERSION_TOOL` (input: `version` number = the 1-based seq shown to the
  user). Added to the tool list alongside inspect_website_brand / find_images / emit_email.
- Dispatch branch: looks up `EmailVariant` by `emailId_seq` (composite unique on
  `[emailId, seq]`), returns `{ version, subject, componentCode, variableSchema }`. On
  miss returns `{ error, latestVersion }`. Emits running/done `tool_call` events
  (title "Reading version" / "Read version N").
- System instruction: added a VERSION HISTORY line telling the model to call the tool to
  revert/reuse earlier versions and never reconstruct old code from memory.
- Edit prompt: cheap `versionLine` ("Saved versions: 1..N (version N is latest) …") so the
  agent knows the available range without receiving any old code.

## Frontend — `apps/client/components/project/editor/ToolCalls.tsx`
- `iconFor("get_email_version")` → `Clock01Icon`. Tool-call events pass through the
  existing stream handler (no whitelist), so the card renders with backend title/status.

## Notes
- Versions = `EmailVariant` rows (seq-ordered). "Version 3 · latest" = seq 3.
- Backend + relevant client files typecheck clean (pre-existing unrelated error in
  ShareProjectDropdown.tsx).
