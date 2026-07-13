# 146 — Eliminar tone / length / audience en todo el stack

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Pedido

Los campos tone/length/audience sonaban genéricos y ya no tenían UI que los
alimentara (el prompt box dejó de exponerlos). Borrar todo lo relacionado.

## Cambios

### Shared

- `prompts.ts`: `PendingPromptSchema` y `CreatePendingPromptSchema` sin el trío.
- `emails.ts`: `CreateEmailSchema`, `EmailDtoSchema` y
  `CreateEmailFromTemplateSchema` sin el trío.
- `auth.ts`: `PendingPromptFields` queda solo con `pendingPrompt` (se van
  `pendingTone/pendingLength/pendingAudience`).
- `admin.ts`: `AdminEmailListItemSchema` y `AdminEmailDetailSchema` sin el trío.

### Backend

- Prisma: columnas `tone/length/audience` eliminadas de `Email` y
  `PendingPrompt`; migración `20260712000000_drop_tone_length_audience`
  (DROP COLUMN IF EXISTS). Aplicada en dev local; prod la corre en el boot.
- `emails.service.ts`: create, materializeTemplate, from-template,
  consume-pending-prompt y `toDto` sin el trío.
- `prompts.service.ts` y `auth.service.ts` (pending prompt en login) idem.
- `generation.service.ts`: el user prompt ya no inyecta `Tone:/Length
  preference:/Audience:`; `titleContext` queda solo con `prompt`.
- `conversation-title.agent.ts`: input y prompt sin tone/audience.
- `admin-emails.service.ts`: list y detail sin el trío.

### Cliente

- `ClientPromptBox.tsx`: `PromptSubmitInput` sin el trío.
- `email-template-project/page.tsx`: `createEmail` sin el trío; ya no lee
  `?tone/&length/&audience` de la URL; analytics sin `has_tone/has_length/
  has_audience`.
- `ProjectLibrary.tsx`: subtítulo y búsqueda sin audience/tone/length.
- `show-case-utils.ts`: sugerencia de categorías sin `email.audience`.

### Admin

- `emails/[id]/page.tsx`: MetaGrid sin filas Tone/Length/Audience.

## Notas

- Se conservan usos no relacionados: `audience` del verificador JWT de Google,
  `copyTone` del brand inspection, tonos de UI (`tone: "danger"`), y el icon
  `tone` dark/light de `get_email_icons`.
- El landing (apps/frontend, solo referencia) puede seguir mandando
  `pendingTone` en el login; zod no-strict descarta keys desconocidas.

## Verificación

- `tsc --noEmit` limpio en backend, client y admin; `@madoo/shared` rebuild.
- Tests backend: 46/46 pass.
- `prisma migrate status`: base local al día tras `migrate deploy`.
