# `@madoo/ui` — Madoo Design System

Design system del monorepo Madoo AI: componentes React + tokens CSS +
Storybook como playground/documentacion. **No reemplaza** los componentes
existentes en `apps/frontend`; es una capa nueva, opt-in, lista para que la
app vaya migrando componente a componente.

## Quick start

```bash
# Desde la raiz del monorepo
pnpm install

# Levantar Storybook en http://localhost:6006
pnpm --filter @madoo/ui dev
# o
pnpm --filter @madoo/ui storybook

# Build estatico (para deploy de la documentacion)
pnpm --filter @madoo/ui build
```

> El comando `dev` arranca Storybook con `--no-open`, ideal para CI/dev
> servers. Usa `storybook` cuando quieras que abra el navegador.

## Estructura

```
packages/ui/
├── src/
│   ├── tokens/
│   │   ├── tokens.css   ← variables (colores, radii, sombras, espacios)
│   │   ├── fonts.css    ← carga Inter, Instrument Serif, JetBrains Mono
│   │   └── base.css     ← reset minimal y helpers (.madoo-serif, .madoo-mono)
│   ├── lib/cx.ts        ← helper className
│   ├── foundations/     ← stories de tokens, color y tipografia
│   └── components/      ← un folder por componente con CSS y stories
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
| `PromptPill`        | Pills `Tone / Length / Audience`                                           |
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
| `Icon`              | Set completo (sparkle, arrow, check, x, ...)                               |

## Themes

Storybook permite cambiar entre `Default`, `Warm` e `Indigo` desde la
toolbar. Los componentes solo dependen de `var(--ink)`, `var(--accent)`,
etc. — agregar un tema nuevo es declarar `[data-theme="..."]` en
`tokens.css`.

## Como integrarlo en la app

1. Agregar la dependencia (ya esta lista para `pnpm install`):
   ```jsonc
   // apps/frontend/package.json
   "dependencies": {
     "@madoo/ui": "workspace:*"
   }
   ```
2. En `apps/frontend/app/layout.tsx`:
   ```tsx
   import "@madoo/ui/tokens.css";
   import "./globals.css";
   ```
3. Importar componentes:
   ```tsx
   import { Button, Modal, Banner } from "@madoo/ui";
   ```

> Nota: `tokens.css` del DS es un superset compatible con el `globals.css`
> actual. Importarlo no rompe nada — solo agrega los tokens semanticos
> (`--success`, `--danger`, `--radius-*`, `--shadow-*`, etc.) que la app
> aun no usa.
