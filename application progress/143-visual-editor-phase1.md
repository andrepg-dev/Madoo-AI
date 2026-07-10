# 143 — Visual Email Editor, Fase 1 (click-to-edit + AI targeting)

**Fecha:** 2026-07-10
**Rama:** `feat/visual-email-editor`
**Contexto previo:** research en `142-research-drag-drop-email-editor.md` (opción recomendada: instrumentación AST estilo Onlook, TSX como única fuente de verdad).

## Qué se construyó

Edición visual "IA + humano" sobre el preview del email: el usuario activa el
modo **Edit** en el sidebar, hace click en cualquier elemento del iframe y
puede **editar su texto**, **eliminarlo** o **pedirle a la IA** que actúe
exactamente sobre ese elemento. Las ediciones manuales no consumen créditos y
cada una crea una nueva variante (deshacer gratis vía historial de versiones).

### Arquitectura

- El TSX (`EmailVariant.componentCode`) sigue siendo la única fuente de verdad.
- Puente DOM→AST: un pase de tagging con recast estampa `data-m-id="line:column"`
  (posición del JSXElement en el código guardado) sobre cada elemento visual.
  Los componentes de react-email hacen spread de props, así que los atributos
  sobreviven hasta el HTML compilado.
- Atributos adicionales: `data-m-text` (`literal` | `var:<name>`) marca texto
  editable; `data-m-dynamic="1"` marca elementos dentro de `.map`/condicionales
  (sin ops estructurales — solo "Ask AI").
- Los ids solo valen contra la variante que los generó: cada apply reimprime el
  código, así que el cliente refetchea el HTML taggeado por variante.

### Shared (`packages/shared/src/visual-edit.ts`, commit `5e5b91b`)

- `VisualEditOpSchema`: `{op:"setText", nodeId, text}` | `{op:"delete", nodeId}`.
- `ApplyVisualEditSchema`: `{baseVariantId, ops[1..20]}`.
- `EditableEmailHtmlDtoSchema`: `{variantId, html}`.
- `SelectedEmailElementSchema`: `{nodeId, label}`; `EditEmailSchema` acepta
  `selectedElement` opcional.

### Backend (commit `55b4a87`)

- `emails/tsx-visual-ops.ts`: motor AST con recast (`babel-ts`).
  - `tagComponentSource` — estampa ids/flags; salta estructurales (Html, Head,
    Preview, Font, Tailwind…).
  - `applyVisualOps` — parchea el AST preservando formato; setText sobre texto
    var-bound actualiza el default del prop y sincroniza `variableSchema`;
    delete con `path.prune()`; protege Html/Head/Body/Preview y dinámicos.
  - `extractElementSnippet` — snippet TSX del elemento para el prompt de la IA.
- Endpoints: `GET :id/variants/:variantId/editable-html` (render taggeado,
  nunca persistido) y `POST :id/visual-edit` (aplica ops → guard de seguridad →
  recompila → nueva variante → fila STATUS en chat → product event;
  **sin** `assertCanGenerate`: gratis).
- `editEmailStream`/`runEdit` aceptan `selectedElement` e inyectan el snippet
  del elemento en el prompt de edición ("apply the instruction to exactly this
  element").
- Guard endurecido: `dangerouslySetInnerHTML` bloqueado (AST + JSXAttribute) —
  el iframe del editor es same-origin.
- Tests: `tsx-visual-ops.spec.ts` (17 casos, incluye compile end-to-end por
  `ReactToHtmlService` verificando que los ids sobreviven). 28/28 backend.

### Cliente (commit `ffae019`)

- `actions/emails.ts`: `fetchEditableEmailHtml` + `applyEmailVisualEdit`
  (patrón Server Action + FetchWrapper + zod parse).
- `useVisualEditSelection.ts`: el iframe del preview es
  `sandbox="allow-same-origin"` con srcDoc, así que el parent adjunta listeners
  directamente en `contentDocument` — sin scripts inyectados ni postMessage.
  Hover outline (solo el elemento más interno), click selecciona
  (`closest("[data-m-id]")`, links bloqueados), rect mapeado 1:1 al overlay
  host (el iframe nunca scrollea internamente). `docVersion` re-adjunta en cada
  load del iframe.
- `VisualEditToolbar.tsx`: toolbar flotante — Edit text (textarea inline,
  prefill desde el default de la variable si es var-bound), Ask AI, Delete
  (deshabilitado en dinámicos), deselección. Cmd/Ctrl+Enter guarda.
- `EmailPreviewSidebar.tsx`: pill "Edit" (CursorMagicSelection01Icon) junto a
  Variables; overlay host relativo envolviendo el iframe; selección se limpia
  al cambiar modo/ancho/documento.
- `page.tsx`:
  - Query `["email-editable", emailId, variantId]` → HTML taggeado solo con el
    modo activo; fallback al preview normal mientras carga.
  - Mutación visual-edit → sembra `["email", emailId]` con el DTO devuelto,
    salta a la variante nueva (`setSelectedVariantId(null)`), invalida chat y
    lista.
  - "Ask AI" fija un chip 🎯 sobre el prompt box (`Editing <p> "…"`); el
    siguiente edit envía `selectedElement` y ancla `baseVariantId` a la
    variante donde se seleccionó. El chip se descarta si cambia la variante.
  - El modo edit se apaga durante streaming (el HTML en vivo no lleva ids).

## Decisiones

- **Ediciones manuales gratis** (no llaman a la IA) — diferenciador vs edits de chat.
- **Cada op = nueva variante** — undo gratis con el dropdown de versiones ‹x/y›.
- Elementos dinámicos (`.map`) solo permiten "Ask AI": tocar una instancia del
  loop en el AST cambiaría todas.
- `line:column` como id (estable dentro de una variante, regenerado por apply)
  en lugar de UUIDs persistidos en el código.

## Incidencias de entorno resueltas

- `apps/client/node_modules` y `packages/shared/node_modules` no existían
  (instalación previa filtrada): todos los tipos de `@madoo/shared` colapsaban
  a `any` (zod irresoluble desde `dist/*.d.ts` con `skipLibCheck`), lo que
  producía ~221 errores fantasma de tsc. `pnpm install` completo lo arregló;
  tras eso, typecheck limpio con un solo fix real (narrowing de
  `editableHtmlQuery.data`).

## Verificación

- `tsc --noEmit` apps/client: limpio.
- `next build` apps/client: pasa.
- Backend: 28/28 tests, typecheck limpio.

## Pendiente (fases siguientes, no en esta rama)

- Drag-and-drop de secciones (reordenar con AST move ops).
- Edición inline de estilos (color/tamaño) vía ops adicionales.
- Duplicar elemento.
- Smoke test manual end-to-end en dev (backend + client corriendo).
