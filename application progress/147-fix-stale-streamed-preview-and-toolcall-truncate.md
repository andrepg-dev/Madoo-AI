# 147 — Fix: preview revertía ediciones visuales + truncado de tool calls

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Bug 1 — Ediciones visuales "desaparecían" al salir del modo edit

Borrar un elemento en modo edit funcionaba (op guardada, variante nueva
creada), pero al desactivar el modo edit el email volvía a verse como antes.

**Causa:** `previewSrcDoc = streamedHtml ?? activeVariant?.compiledHtml`.
`streamedHtml` (snapshot del `done` del stream de IA) solo se limpiaba al
cambiar de email, así que enmascaraba cualquier variante posterior — las de
ediciones visuales incluidas. En modo edit se ve el HTML taggeado fresco; al
salir caía al snapshot viejo.

**Fix:** el effect que salta a la versión más nueva (`latestVariantId`)
ahora también limpia `streamedHtml` y `streamedSubject`. Cuando la variante
persistida llega a cache trae el mismo HTML, así que no hay flash; y las
variantes guardadas después ya no quedan tapadas. También arregla que el
dropdown de versiones no cambiaba el preview tras una generación streameada.

## Bug 2 — Detalle de tool call rompía el layout

`min-w-0 flex-1` en el span del detalle empujaba el título a dos líneas con
URLs largas. Ahora: título `shrink-0 whitespace-nowrap`, detalle
`max-w-[45%] truncate`.
