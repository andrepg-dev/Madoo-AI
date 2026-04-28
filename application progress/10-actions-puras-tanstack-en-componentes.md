---
date: 2026-04-27
area: frontend / shared / conventions
files:
  - packages/shared/src/auth.ts (nuevo)
  - packages/shared/src/prompts.ts (nuevo)
  - packages/shared/src/index.ts
  - apps/frontend/actions/auth.ts
  - apps/frontend/actions/workspaces.ts
  - apps/frontend/actions/prompts.ts
  - apps/frontend/components/auth/AuthContext.tsx
  - apps/frontend/components/workspace/WorkspaceContext.tsx
  - docs/CONVENTIONS.md
---

# 10 — `actions/` puros + TanStack Query en componentes

Refinamiento de convención sobre la entrada 09. El patrón "hook
personalizado por endpoint" se elimina del repo.

## Cambio de convención

**Antes:** `actions/<resource>.ts` exportaba (a) funciones del API
client + (b) hooks `useResource`, `useCreateResource`, etc. que
envolvían TanStack Query.

**Ahora:** `actions/<resource>.ts` exporta **únicamente**:

1. Schemas zod (body de request + response), importados desde
   `@madoo/shared`.
2. Funciones puras async (`resourceApi.list`, `resourceApi.create`).
3. Query keys jerárquicos.

**Sin** `useQuery`/`useMutation`, sin `"use client"`, sin hooks
personalizados. Los componentes usan TanStack Query directamente.

## Por qué

- Los wrappers ocultaban opciones de TanStack Query (`enabled`,
  `staleTime`, `onSuccess`) y obligaban a abrir el archivo del action
  cada vez que se quería ajustar comportamiento.
- Con TanStack Query directo en el componente, las opciones viven
  donde se usan. La signature es la de TanStack — sin contratos
  ad-hoc por feature que el desarrollador tenga que aprender.
- Los actions quedan puros: testeables sin React, reusables desde
  cualquier capa (server actions, scripts, tests).

## Qué se hizo

### `@madoo/shared` (nuevos schemas)

- `auth.ts`: `GoogleLoginInputSchema`, `GoogleLoginResponseSchema`
  (compone `UserSchema` + `MyWorkspaceSchema` ya existentes).
- `prompts.ts`: `PendingPromptSchema`, `CreatePendingPromptSchema`.
- Re-exports en `index.ts`.

Todo input/output del backend que cruza la red ahora tiene su zod
schema en shared.

### `actions/auth.ts` — refactor

- Eliminados `useGoogleLogin`, `useMe`.
- `authApi.loginWithGoogle(input)` valida `input` con
  `GoogleLoginInputSchema` antes de mandar; valida la respuesta con
  `GoogleLoginResponseSchema` antes de retornar.
- `authApi.me()` valida con `UserSchema`.

### `actions/workspaces.ts` — refactor

- Eliminado `useMyWorkspaces`.
- `workspacesApi.listMine()` parsea con `MyWorkspaceSchema[]`.

### `actions/prompts.ts` — refactor

- Eliminados `usePendingPrompts`, `useCreatePendingPrompt`,
  `useConsumePendingPrompt`.
- `promptsApi` con `listPending`/`createPending`/`consumePending`,
  todas con parse de body y response.

### Consumidores

- `AuthContext.tsx`: ahora hace `useQuery({ queryKey:
  authKeys.me(), queryFn: () => authApi.me(), enabled: hasToken,
  retry: false, staleTime: 5min })` directamente. Sin pasar por un
  custom hook.
- `WorkspaceContext.tsx`: idem con `workspaceKeys.me()` /
  `workspacesApi.listMine()`.

`LoginModal` ya consumía `authApi.loginWithGoogle` directamente
(sin `useGoogleLogin`), no requirió cambios.

### Documentación

- `docs/CONVENTIONS.md` sección 5 reescrita con el nuevo patrón.
  Ejemplo canónico actualizado: action sin hooks, componente con
  `useQuery`/`useMutation` directo. Lista explícita de prohibiciones.

## Verificación

- `pnpm --filter @madoo/frontend exec tsc --noEmit` ✅ limpio.
- `pnpm --filter @madoo/frontend build` ✅ OK.
- Búsqueda `grep -rn "useGoogleLogin\|useMe\|useMyWorkspaces\|use*Pending*"`
  → solo aparecen las usadas a través de `useQuery` directo de TanStack.

## Pendiente

- Cuando lleguen Fase 1+ (Email, Contact, Domain, Campaign), todos los
  `actions/*.ts` siguen este patrón sin excepciones.
