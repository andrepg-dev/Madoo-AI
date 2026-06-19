# 104 — Landing microphone button works

The mic buttons in the landing prompt boxes (hero + CTA) were inert — no
`onClick`. Wired them to voice dictation.

## Approach
The client app's dictation has a backend fallback (`/api/transcription`) that
**requires a signed-in user**, so it can't be reused on the public landing page.
Used the browser-native **Web Speech API** instead — fully client-side, no auth,
no backend.

- New hook: `apps/landing/lib/use-dictation.ts` (`useDictation({ value, onChange })`)
  - `SpeechRecognition` / `webkitSpeechRecognition`, continuous + interim.
  - Captures the typed text as a base on start and appends recognized speech.
  - Tears down on unmount; exposes `{ isListening, supported, toggle }`.
- `apps/landing/components/HomePage.tsx`: both mic buttons now call
  `dictation.toggle`, show `aria-pressed`, and turn red while listening. Both
  prompt textareas share the same `prompt` state, so one hook drives both.

## Notes
- No toast in landing, so unsupported/denied cases simply no-op (button does
  nothing) rather than surfacing an error.

## Verification
- `tsc --noEmit` clean for `apps/landing`.
