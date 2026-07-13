# 150 — Quitar chips 'Manual edit: …' del chat

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Pedido

Las ediciones visuales dejaban chips "Manual edit: Moved <Heading>." en el
timeline del chat. El usuario no las quiere.

## Cambios

- Backend: `applyVisualEdit` ya no crea la fila STATUS en emailChatMessage
  (era el único creador de kind STATUS).
- Cliente: `mapChatMessages` filtra kind STATUS — las filas viejas ya
  persistidas tampoco se muestran. El role 'status' client-only (línea
  'Generating your email…') sigue funcionando.
