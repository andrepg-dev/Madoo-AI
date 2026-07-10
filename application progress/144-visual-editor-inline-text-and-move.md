# 144 — Visual editor: edición de texto inline + mover elementos

**Fecha:** 2026-07-10
**Rama:** `feat/visual-email-editor`
**Continúa:** `143-visual-editor-phase1.md`

## Pedido

Tras probar la fase 1, el usuario quería (a) cambiar texto escribiendo
directamente sobre el iframe (no en un textarea del toolbar) y (b) mover
elementos, además de borrar y pedir a la IA.

## Cambios

### Shared (`0bd6088`)

- `VisualEditOpSchema` gana `{op:"move", nodeId, direction:"up"|"down"}`.

### Backend (`66bdaf4`)

- `applyVisualOps` maneja `move`: swap del elemento con su hermano
  anterior/siguiente en `children` del padre JSX.
  - Salta nodos JSXText de whitespace (quedan en su lugar; recast reimprime).
  - Bloques de expresión (`{items.map(...)}`, `{flag && <X/>}`) cuentan como
    hermanos movibles — un Text puede saltar por encima de una sección dinámica.
  - Rechaza: elementos protegidos (Html/Head/Body/Preview), dinámicos, y
    bordes ("already at the top/bottom of its section").
- `PROTECTED_DELETE_NAMES` renombrado a `PROTECTED_STRUCTURE_NAMES` (aplica a
  delete y move).
- 6 tests nuevos (34/34 total): swap arriba/abajo, secciones completas, borde,
  protegidos, recompilación end-to-end.

### Cliente (`8a7911c`)

- **Edición inline (WYSIWYG):** "Edit text" del toolbar (o doble click sobre
  el elemento) pone `contenteditable="plaintext-only"` sobre el nodo dentro
  del iframe, enfoca y selecciona el contenido. Enter o click fuera → commit
  como op `setText`; Escape → restaura innerHTML original. Outline verde
  mientras se edita; el toolbar se oculta. El textarea del toolbar se eliminó.
  - Commit normaliza whitespace y no dispara op si el texto no cambió.
  - Los clicks dentro del elemento en edición no se interceptan (caret libre);
    el resto de clicks siguen bloqueados (links no navegan).
- **Move up/down:** botones ↑/↓ (ArrowUp02Icon/ArrowDown02Icon) en el toolbar
  → op `move`. Estado de borde no se puede conocer client-side (estructura DOM
  de react-email ≠ estructura JSX), así que el server responde con error claro
  y llega como toast.

## Notas técnicas

- Tras cada move la variante nueva recarga el iframe y la selección se pierde
  (los ids `line:column` cambian con cada reimpresión) — mover varias
  posiciones requiere re-seleccionar. Limitación conocida de la fase; el
  drag-and-drop real con drop targets sería la siguiente iteración.
- Var-bound text inline: el DOM muestra el valor compilado (WYSIWYG); el
  commit actualiza el default del prop + variableSchema como antes.

## Verificación

- Backend: 34/34 tests, typecheck limpio.
- Cliente: `tsc --noEmit` limpio, `next build` compila.

## Incidencia dev resuelta (misma sesión)

- POST /emails fallaba con `The column createdByUserId does not exist` — la DB
  local (localhost:5433) tenía 5 migraciones sin aplicar (desde
  `20260630120000`). `prisma migrate deploy` las aplicó.
