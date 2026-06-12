# 51 - Functional Landing Auth Modal

Date: 2026-06-11

## Work

- Kept the restored landing login UI as the first screen.
- Made Google, GitHub, Apple, email login, and email registration functional from the landing modal.
- Email flow asks for password after the original email-only step, using the same modal/input style.
- Auth still passes pending prompt/dropdown fields to client after login.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke for bad login, valid registration, and valid login.

## Notes

- Did not run build commands per repository instruction.
