# 151 — Prompt: padding vertical en mobile (top)

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Pedido

Con el full-width mobile (log 148), el contenido quedaba pegado al borde
superior. Mantener 0 horizontal pero mover ese aire al eje vertical.

## Cambios en generation.prompts.ts

- Patrón responsive gana `.section-top { padding-top: 28px !important; }`.
- Regla MOBILE PADDING: primera sección con padding-top 24-32px !important
  (clase section-top), ritmo vertical cómodo entre secciones; horizontal
  sigue prohibido salvo pedido explícito.

Solo generaciones nuevas; requiere deploy manual en prod.
