# 13 — Auth modal on Design System (batch 2)

## Cambios

### `components/auth/LoginModal.tsx`

- Overlay + dialog inline (250 LOC con backdrop, escape handler, click
  fuera, botón "X") → `<Modal open onClose size="sm">` del DS, que ya
  resuelve overlay, escape, click fuera y close button.
- Eliminado el `if (!loginOpen) return null` manual: el Modal del DS lo
  hace internamente.
- Bloque de error rojo inline (`#FBE8E2`/`#A23E2F`) → `<Banner
  tone="danger">`.
- Import de `Icon` local removido (ya no se usa: el Modal del DS pinta
  su propio "X").

Lo que se mantiene como markup propio dentro del modal:

- Glyph "M" (cuadrado 44px con serif italic) — branding one-off.
- `<h2 className="serif">` "Continue to Madoo AI" y el párrafo
  descriptivo. Decidí **no** usar `title`/`description` del Modal
  porque queremos que aparezcan **debajo** del glyph, no en el header
  del DS (que es la región arriba con el close button).
- Quote del pending prompt (estilo italic dentro de surface-2).
- El contenedor `ref={buttonRef}` donde Google Identity Services
  renderiza su botón (no podemos reemplazarlo, es markup inyectado por
  GIS).
- Disclaimer "By continuing you agree…" al pie.

## Pendiente

- Próximo batch (3): `home/TemplateCard`, `home/GeneratingScreen`,
  `home/EditorScreen`.
