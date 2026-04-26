---
date: 2026-04-26
area: frontend / auth
files:
  - apps/frontend/components/auth/LoginModal.tsx
---

# 05 — Fix: Google login completaba el sign-in pero no guardaba la sesión

## Síntoma

El usuario hacía click en "Continue with Google", el popup de Google se
mostraba y devolvía un `credential` válido, el backend respondía 200 con
`{ token, user }`, pero el frontend nunca guardaba el token ni cerraba el
modal — el login parecía no funcionar a pesar de que las credenciales de
Google estaban correctamente configuradas.

## Causa raíz

`LoginModal` tenía esta dependencia en el `useEffect` que inicializa el
botón GSI:

```ts
}, [loginOpen, finishLogin, pendingPromptForGate, googleLogin]);
```

`googleLogin` es el objeto retornado por `useMutation` de TanStack Query.
Esa referencia cambia en cada render — incluyendo el render que ocurre
cuando `isPending` pasa de `false` → `true` justo después de que el
usuario hace click en el botón de Google.

Secuencia del fallo:

1. Usuario hace click en el botón de Google.
2. `handleCredential` se dispara y llama `await googleLogin.mutateAsync(...)`.
3. `isPending` flips a `true` → re-render → `googleLogin` es objeto nuevo.
4. El cleanup del `useEffect` corre y setea `cancelled = true` sobre el
   closure que aún espera la respuesta del backend.
5. La mutación resuelve OK (token + user llegan).
6. De vuelta en `handleCredential`: `if (cancelled) return;` aborta antes
   de llamar a `finishLogin`. El token nunca se persiste.

Bonus: `pendingPromptForGate` también provocaba re-inits del botón GSI
cada vez que el padre re-renderizaba.

## Fix

`apps/frontend/components/auth/LoginModal.tsx`:

- El `useEffect` ahora depende sólo de `[loginOpen]`. Se inicializa GSI
  exactamente una vez por apertura del modal.
- `pendingPromptForGate` y `finishLogin` se leen vía refs vivos
  (`pendingRef`, `finishLoginRef`) dentro del callback de GSI, así
  cambios en el padre no re-inicializan el script ni cancelan la
  mutación en vuelo.
- Se removió `useGoogleLogin()` (wrapper de `useMutation`) y se llama
  directo a `authApi.loginWithGoogle(...)`. Acá no aporta nada — no se
  comparte estado de mutación con otra parte del árbol — y era la
  fuente de la referencia inestable. `submitting` y `error` ya se
  manejan con state local.

## Verificación

- `pnpm exec tsc --noEmit` en `apps/frontend` → sin errores.
- Pendiente verificación manual end-to-end del flujo de login en el
  navegador (`pnpm dev` en backend y frontend, abrir modal, sign-in,
  confirmar que el token se guarda en `localStorage` y `/auth/me`
  responde con el usuario).
