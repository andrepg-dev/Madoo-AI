# `@madoo/design-system` — Madoo Design System

Design system del monorepo Madoo AI: componentes React con Tailwind v4 +
tokens compartidos + Storybook como playground/documentacion. Este es el nuevo sistema visual del
pivot, basado en la landing page: blanco limpio, gris frio, tinta casi
negra, azul profundo y acento azul-violeta.

## Quick start

```bash
# Desde la raiz del monorepo
pnpm install

# Levantar Storybook en http://localhost:6006
pnpm --filter @madoo/design-system dev
# o
pnpm --filter @madoo/design-system storybook

# Build estatico (para deploy de la documentacion)
pnpm --filter @madoo/design-system build
```

> El comando `dev` arranca Storybook con `--no-open`, ideal para CI/dev
> servers. Usa `storybook` cuando quieras que abra el navegador.

## Estructura

```
packages/design-system/
├── src/
│   ├── tokens/
│   │   ├── tokens.css   ← variables, aliases landing y helpers visuales
│   │   ├── fonts.css    ← carga Figtree, IBM Plex Sans, Inter, JetBrains Mono
│   │   └── base.css     ← reset minimal y helper .madoo-mono
│   ├── tailwind.css     ← Tailwind v4 entry + @theme + @source del paquete
│   ├── lib/cx.ts        ← helper className
│   ├── foundations/     ← stories de tokens, color y tipografia
│   └── components/      ← un folder por componente con Tailwind classes y stories
├── .storybook/          ← config Storybook (vite + a11y + themes)
└── package.json
```

## Componentes incluidos

| Componente          | Reemplaza                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| `Button`            | Botones inline en `HomeScreen`, `ComposeModal`, `EditorScreen`             |
| `IconButton`        | Botones X de modales, controles de variante v1/v2/v3                       |
| `Input`             | Inputs de subject, fallback, brand kit, etc.                               |
| `Textarea`          | Textarea principal del prompt y del AI editor                              |
| `Select`            | Selectors nativos del compose modal                                        |
| `Checkbox`          | Toggle de A/B testing                                                      |
| `Dropdown`          | Menus de seleccion para filtros, visibilidad y prompt controls             |
| `SegmentedControl`  | Filtros de categorias en HomeScreen                                        |
| `SuggestionChip`    | Sugerencias de prompts                                                     |
| `Tag`               | Tokens monospace tipo `{Nombre}` y badges inline (`12 missing`)            |
| `Badge`             | Pill de "Trained on 10,000+ emails" y status badges                        |
| `Banner`            | Cajas de "AI Suggestion" / variables faltantes                             |
| `Card`              | Cualquier surface elevada                                                  |
| `SelectableCard`    | Tarjetas seleccionables del compose (drafts / segmentos)                   |
| `Modal`             | LoginModal, ComposeModal                                                   |
| `Avatar`            | Logo "M" del brand y avatares                                              |
| `Spinner`           | Loaders en GeneratingScreen                                                |
| `ProgressBar`       | Indicador de progreso de pasos                                             |
| `Kbd`               | Tecla `↵` y atajos                                                         |
| `Icon`              | Wrapper Hugeicons (sparkle, arrow, check, x, ...)                          |

## Principios visuales

- **White first**: superficies principales blancas, fondos gris frio y reglas
  finas en azul tinta.
- **Hugeicons only**: iconografia del sistema usa `@hugeicons/react` y
  `@hugeicons/core-free-icons`.
- **Producto visible**: templates, previews, providers y controles reales antes
  que ilustraciones genericas.
- **App densa, landing amplia**: componentes compactos para plataforma; panels
  grandes solo para marketing, modales o previews.
- **Tailwind native**: componentes no importan CSS propio; sus estados,
  variantes y responsive styles viven en `className`.
- **Tokens compartidos**: `--madoo-*` aliases replican la landing para que
  `@madoo/landing` y `@madoo/frontend` converjan.
- **Shadow-border only**: edges, dividers y estados usan `box-shadow` con
  `--shadow-border*`; `border` queda solo para resets como `border: none`.

## Themes

Storybook permite cambiar entre `Default`, `Paper` y `Midnight` desde la
toolbar. Los componentes solo dependen de `var(--ink)`, `var(--accent)`,
etc. — agregar un tema nuevo es declarar `[data-theme="..."]` en
`tokens.css`.

## Como integrarlo en la app

1. Agregar la dependencia (ya esta lista para `pnpm install`):
   ```jsonc
   // apps/frontend/package.json
   "dependencies": {
     "@madoo/design-system": "workspace:*"
   }
   ```
2. En `apps/frontend/app/layout.tsx`, cargar tokens:
   ```tsx
   import "@madoo/design-system/tokens.css";
   import "./globals.css";
   ```
3. En `apps/frontend/app/globals.css`, cargar Tailwind desde el DS:
   ```css
   @import "@madoo/design-system/tailwind.css";
   ```
4. Importar componentes:
   ```tsx
   import { Button, Modal, Banner } from "@madoo/design-system";
   ```

> Nota: `tailwind.css` declara el theme `madoo-*` y hace `@source` de los
> componentes del paquete para que Tailwind compile las clases usadas por el
> design system desde cualquier app consumidora.
