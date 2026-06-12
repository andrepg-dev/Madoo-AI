# 51 - Functional Landing Auth Modal

Date: 2026-06-11

## Work

- Kept the restored landing login UI as the first screen.
- Made provider rows functional:
  - Google posts id token to landing auth API.
  - GitHub starts OAuth and preserves safe `next` plus pending prompt fields.
  - Apple uses popup auth when configured.
- Made email flow functional without changing the initial UI:
  - first click keeps the same email-only screen behavior
  - next step asks for password in the same input style
  - supports login and create-account toggle
  - forwards pending prompt/dropdown fields to backend
- Successful auth redirects to:
  - `/email-template-project?pendingPromptId=...` when backend creates a pending prompt
  - otherwise safe client `next`

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke:
  - bad login returns 401
  - valid email registration returns 200 and sets shared cookies
  - valid email login returns 200 and sets shared cookies

## Notes

- Did not run build commands per repository instruction.
