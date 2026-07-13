# 152 — Edit mode: cursor default + activación por doble click

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Pedido

1. No gustaba el cursor `grab` (manito) sobre cada elemento en modo edit.
2. El modo edit debe activarse con doble click sobre el iframe del preview.

## Cambios

- `useVisualEditSelection`: cursor de elementos taggeables `grab` → `default`
  (flecha). `grabbing` durante drag y `text` en edición inline se mantienen.
- `EmailPreviewSidebar`: nuevo effect — con modo edit apagado, listener
  `dblclick` en el contentDocument del iframe llama `visualEdit.onToggle()`.
  Se re-engancha en cada load del iframe (docVersion).

Verificado en Chrome: doble click sobre el preview activa Edit (botón oscuro,
outline de hover en el headline).
