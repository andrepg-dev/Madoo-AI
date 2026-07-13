# 148 — Prompt: sin padding horizontal en mobile

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Pedido

Los emails generados metían `.section-pad { padding-left/right: 20-22px !important }`
en el media query mobile. En smartphone el template debe usar el ancho
completo — nada de padding horizontal salvo que el usuario lo pida.

## Causa

La regla RESPONSIVE de `generation.prompts.ts` enseñaba ese patrón textual
(20px por lado en mobile). El modelo lo copiaba. Seed templates limpios.

## Cambios

- Patrón del media query: `.section-pad` ahora `padding-left/right: 0 !important`.
- Nueva regla MOBILE PADDING: ancho completo en mobile, prohibido introducir
  padding horizontal dentro del media query salvo pedido explícito.
- Regla de spacing (28-44px) acotada a desktop para no contradecir.

Solo afecta generaciones nuevas; emails existentes conservan su CSS.
Requiere deploy manual del backend en prod.
