# 145 — Visual editor: imágenes, drag & drop, autosave · retención de versiones · catálogo de iconos

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`
**Continúa:** `144-visual-editor-inline-text-and-move.md`

## Pedido

Seguir la fase 2 del editor visual (reemplazar imágenes, reordenar con drag &
drop, guardado automático) y dos mejoras de backend: limitar el historial de
versiones por email y darle a la IA un catálogo curado de iconos email-safe.

## Cambios

### Shared + backend — op `setImage` (`5b0cc9a`)

- `VisualEditOpSchema` gana `{op:"setImage", nodeId, url}` (solo http/https,
  máx 4096 chars). Límite del batch de ops sube de 20 a 100 (autosave agrupa).
- `applyVisualOps` reescribe el `src` de `<Img>/<img>`: si el src está atado a
  un prop con default string, actualiza el default (y `variableUpdates`); si es
  literal lo reemplaza; si falta, agrega el atributo.
- El mapa de node-ids se recalcula tras cada op estructural (delete/move/
  moveTo) para que ops posteriores del mismo batch resuelvan posiciones
  frescas.

### Backend — retención de versiones (`cbe440a`)

- Nuevo `EmailVariantRetentionService.prune(emailId)`: conserva las
  `MAX_EMAIL_VERSIONS = 20` variantes más nuevas, borra filas viejas y sus
  previews en S3.
- Corre al fetch del email, tras ediciones manuales y tras cada save del
  agente.
- `S3Service`: `publicUrlForKey` (keys URL-encoded) y `deletePublicUrl`, que
  solo borra objetos cuyo host coincide con el bucket/región configurados.

### Backend — tool `get_email_icons` (`babced1`)

- `EmailIconCatalogService`: renderiza iconos de `@hugeicons/core-free-icons`
  a PNG (tono dark/light), sube a S3 y cachea por nombre+tono.
- Nueva tool del agente `get_email_icons` (1-8 nombres del catálogo + tono),
  con eventos `tool_call` que muestran las URLs generadas.
- Prompts: usar iconos como `<Img>` de 20-28px, nunca SVG inline ni emoji;
  los prompts y `get_email_version` ahora exponen el rango retenido
  (`earliest..latest`, máx 20) en vez de `1..N`.

### Cliente — drag & drop, reemplazo de imagen, autosave (`70a6b94`)

- **Drag & drop:** arrastrar el elemento seleccionado dentro del iframe
  muestra un indicador de drop (detecta eje horizontal/vertical según el
  layout del padre) y un ghost del elemento; al soltar emite op `moveTo`.
- **Reemplazar imagen:** acción en el toolbar con file picker; sube vía
  `uploadEmailImage` y aplica `setImage`; el iframe refleja el cambio al
  instante.
- **Autosave:** `useVisualEditAutosave` agrupa ops pendientes y guarda tras
  idle; flush en unmount/navegación; el sidebar muestra estado
  guardando/guardado.
- `VersionsDropdown` ordena variantes por `seq` para la ventana retenida.

## Tests

- `pnpm --filter backend test` ahora corre también
  `email-variant-retention.spec.ts` y `email-icon-catalog.spec.ts`.
