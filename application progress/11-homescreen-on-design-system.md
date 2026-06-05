# 11 — HomeScreen on Design System

## Contexto

Fase de integración del paquete `@madoo/design-system` (design system propio, en
`packages/design-system`) dentro de `apps/frontend`. Antes de este paso el DS solo se
consumía desde Storybook; la app web seguía usando estilos inline ad-hoc.

Antes de empezar, fix puntual al DS:

- `packages/design-system/src/tokens/base.css` tenía una regla global
  `:focus-visible` que pintaba un `outline: 2px solid var(--accent)` con
  `outline-offset: 2px` a todo `input`/`textarea`/`select`. Esa regla
  ganaba sobre el `outline: none` declarado en cada componente, así que
  al enfocar un `Input`/`Textarea`/`Select` se dibujaban **dos** anillos
  de focus: el del wrapper (border + halo box-shadow) y el outline
  nativo del control desfasado. Se agregó una excepción para los
  controles que viven dentro de los wrappers del DS, dejando que el
  wrapper sea el único responsable del estado focus.

## Cambios

### Wiring del paquete

- `apps/frontend/package.json`: `@madoo/design-system: workspace:*` agregado a
  `dependencies`.
- `apps/frontend/next.config.ts`: `transpilePackages` ahora incluye
  `@madoo/design-system` (el paquete expone TS source, no build).
- `apps/frontend/app/layout.tsx`: import de `@madoo/design-system/tokens.css` antes
  de `globals.css`. Los tokens del DS son superset compatible de los
  globals de la app (mismas variables base + radios/sombras/tipografía
  semánticas que los componentes consumen).

### HomeScreen (`apps/frontend/components/home/HomeScreen.tsx`)

Reemplazo de las primitivas inline por componentes del DS:

- `<textarea>` con styles inline → `Textarea` (variant `ghost`,
  `noResize`, ref pasado tal cual).
- Botón "Brand kit" con border dashed inline → `Button variant="dashed"
  size="sm"` con `leftIcon`.
- Botón "Generate email" inline → `Button variant="primary"` con
  `leftIcon` (sparkle) y `shortcut="↵"` (el DS ya envuelve el atajo en
  un `Kbd` interno).
- Sugerencias (chips redondeados con sparkle) → `SuggestionChip` con
  `leadingIcon`.
- Filtro de categorías (botones manuales en una pildora) →
  `SegmentedControl` con `items={[{value, label}]}`.
- `Dropdown` ahora viene de `@madoo/design-system` en lugar del local
  `@/components/home/Dropdown`. El archivo local quedó huérfano (no
  hay otros consumers), pendiente de borrar en una pasada de cleanup.
- `Icon` ahora viene de `@madoo/design-system` (los nombres `sparkle` y `plus` que
  la home usa están soportados).

Lo que se mantiene como markup propio:

- El "composer card" exterior (`background`, `border`, `border-radius`,
  shadow custom) sigue siendo un `<div>` con styles inline. No hay un
  primitivo en el DS que represente exactamente este contenedor con
  textarea + toolbar dividida y queremos preservar la sombra custom.
- Hero (badge, h1 serif, párrafo) y header de la sección de templates
  siguen siendo inline porque son tipografía one-off, no son
  componentes.

## Pendiente / próximos pasos

- Correr `pnpm install` en la raíz para que la nueva workspace dep se
  enlace.
- Borrar `apps/frontend/components/home/Dropdown.tsx` cuando se
  confirme que ningún branch en vuelo lo usa.
- Migrar las pantallas restantes (`EditorScreen`, `GeneratingScreen`,
  `auth/LoginModal`, paneles de `analytics`/`campaigns`/`contacts`) a
  `@madoo/design-system` en pasadas siguientes.
