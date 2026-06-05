# 12 — Shell on Design System (batch 1)

## Contexto

Continuación del onboarding de `apps/frontend` al paquete `@madoo/design-system`.
Este batch cubre el chrome de la app: `AppShell`, `Sidebar`, `TopBar`.

## Cambios

### `components/shell/AppShell.tsx`

Sin cambios. Solo layout flex de dos columnas (sidebar + main); no hay
primitivas visuales que migrar.

### `components/shell/Sidebar.tsx`

- `Icon` ahora viene de `@madoo/design-system` (antes `@/components/icons/Icon`).
- Pill "BETA" inline → `<Badge tone="accent">`.
- Botón "Upgrade to Pro" inline → `<Button variant="primary" size="sm" block>`.
- Card de "Free plan" → `<Card surface="secondary" padded>`.
- Barrita de progreso 70% → `<ProgressBar value={70} variant="thin">`.
- Quedan como markup propio: brand glyph (M serif italic, one-off),
  nav links (`<Link>` no se reemplaza por `Button` para no perder la
  prefetch de Next), y los swatches de workspace (UI específica).

### `components/shell/TopBar.tsx`

- `Icon` ahora viene de `@madoo/design-system`.
- Search input + icono absolute → `<Input variant="filled"
  startAdornment={<Icon name="search">}>`.
- Botón de notificaciones (cuadrado con border) → `<IconButton
  variant="outline">`.
- Botón "Sign in" → `<Button variant="secondary" size="md">`.
- Avatar del trigger y del header del dropdown → `<Avatar size circle
  tone="accent" src name>`. Esto unifica la lógica de iniciales (el DS
  ya extrae las primeras letras) y el manejo de `src` con fallback. Se
  eliminó la función local `initials()`.
- Color hardcoded `#A23E2F` para "Sign out" → `var(--danger)`.
- Quedan como markup propio: el dropdown menu (no hay primitivo `Menu`
  en el DS todavía) y el `MenuItem` interno.

## Pendiente

- Próximo batch (2): `auth/LoginModal` con `Modal` + `Input` + `Button`
  del DS.
- Cleanup final: borrar `components/icons/Icon.tsx` cuando todos los
  consumers hayan migrado al `Icon` del DS.
