# 50 - Restore Previous Landing Auth UI

Date: 2026-06-11

## Correction

Restored the landing `AuthDialog` visual structure from git history instead of using the newly designed modal.

## Work

- Restored the previous landing login UI with the same provider rows, email input, card layout, and footer.
- Kept auth behavior behind the existing provider buttons.
- Kept product/client without login/register UI.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke for landing `next` and invalid Google auth payload.

## Notes

- Did not run build commands per repository instruction.
