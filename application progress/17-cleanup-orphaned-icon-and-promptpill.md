# 17 — Cleanup orphaned local Icon and Dropdown (batch 6)

Final del onboarding al DS. Una vez migrados todos los consumidores
a `@madoo/design-system`, los duplicados locales quedaron sin uso:

- `apps/frontend/components/icons/Icon.tsx` (163 LOC)
- `apps/frontend/components/home/Dropdown.tsx` (100 LOC)

Ambos eran versiones precedentes que el DS reemplaza 1:1. Los borré, y
con ellos también el directorio `components/icons/` que quedaba vacío.

`grep -rn "@/components/icons/Icon\|home/Dropdown"` post-borrado: 0
hits.

También se incluye un cambio menor de copy en `HomeScreen.tsx` que el
usuario hizo durante la sesión: hero ahora dice *"What email do you
want to **create** today?"* (antes "send").
