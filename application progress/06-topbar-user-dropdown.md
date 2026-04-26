---
date: 2026-04-26
area: frontend / shell
files:
  - apps/frontend/components/shell/TopBar.tsx
  - apps/frontend/components/icons/Icon.tsx
---

# 06 — TopBar muestra el usuario logueado y un menú desplegable

## Contexto

El `TopBar` mostraba un avatar hardcodeado con las iniciales "JD" y no
reaccionaba al estado de autenticación. Tras el fix del login (entrada
05) el usuario ya está disponible en `useAuth()`, así que ahora lo
mostramos arriba a la derecha y exponemos las acciones de cuenta.

## Cambios

`apps/frontend/components/shell/TopBar.tsx` (rewrite):

- Lee `user`, `loading`, `openLogin`, `logout` de `useAuth()`.
- Sin sesión: muestra un botón "Sign in" que dispara `openLogin()`.
- Con sesión: avatar circular usando `user.avatarUrl` (con
  `referrerPolicy="no-referrer"` para que Google no bloquee la imagen),
  fallback a iniciales calculadas desde `name` o `email`.
- El avatar abre un dropdown anclado al botón con:
  - Cabecera con avatar + nombre + email (truncados con ellipsis).
  - "User settings" (icono `settings`) — placeholder, sólo cierra el
    menú por ahora.
  - "Usage" (icono `barChart`) — placeholder.
  - Separador.
  - "Sign out" (icono `logOut`, en rojo) — llama `logout()` del context.
- Cierre del dropdown por click fuera (`mousedown` en `document`) y por
  tecla `Escape`.

`apps/frontend/components/icons/Icon.tsx`:

- Tres iconos nuevos: `logOut`, `barChart`, `user`.

## Verificación

- `pnpm exec tsc --noEmit` en `apps/frontend` → sin errores.
- Pendiente verificación manual: cargar la app sin sesión (debe verse
  "Sign in"), loguearse con Google (avatar/iniciales aparecen), abrir
  dropdown, click "Sign out" (debe limpiar el token y volver al estado
  no-autenticado).

## Pendiente / próximos pasos

- "User settings" y "Usage" sólo cierran el menú. Cuando existan rutas
  reales se conectan con `next/link` o `useRouter().push(...)`.
