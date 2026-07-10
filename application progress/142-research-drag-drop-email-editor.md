# 142 — Research: editor visual drag-and-drop con sync HTML ↔ TSX

**Fecha:** 2026-07-09
**Tipo:** research (sin cambios de código)
**Pregunta:** ¿Es viable un editor drag-and-drop donde el usuario modifique el email renderizado (HTML compilado) y el cambio se refleje en el TSX (react-email)?

---

## 1. Pipeline actual de Madoo

- `EmailVariant.componentCode` (TSX react-email) = **fuente de verdad**. `compiledHtml` = derivado.
- Backend: `ReactToHtmlService` — Babel transpila TSX → sandbox `node:vm` (allowlist AST `react-code-guard.ts`, solo imports `react` + `@react-email/components`) → `renderToStaticMarkup` → HTML.
- Prompts IA: JSX estático con componentes `@react-email/components`, estilos inline (objetos `style`), sin Tailwind, media queries móviles vía `<Head><style>` + classNames.
- Variables: props del componente con defaults (a veces `{{merge tags}}`), `variableSchema` JSON.
- Preview client: iframe `sandbox=""` con `srcDoc` (`email-preview-frame.tsx`). Ediciones actuales: solo vía chat IA.
- Versiones: `@react-email/components@^1.0.12`, React 19.

## 2. Hecho fundamental (resultado del research)

**No existe HTML → TSX.** El render de react-email es one-way: TSX → árbol React → HTML de tablas. El HTML compilado pierde la identidad de componentes (`<Section>` → `<table role="presentation">…`); no hay parser inverso oficial ni librería seria que lo haga con fidelidad. **Toda solución pasa por elegir dónde vive la fuente de verdad editable**, no por "editar el HTML y des-compilarlo".

## 3. Hallazgo principal: existe `@react-email/editor` oficial (nuevo, post-cutoff)

Investigado en el repo `resend/react-email` (branch `canary`, restructurado: packages = `editor`, `react-email`, `render`, `ui`, `create-email`).

- **Qué es:** editor visual embebible para componer emails react-email. MIT (Plus Five Five, Inc = Resend), v1.6.4, construido sobre **TipTap v3 / ProseMirror**. Docs: `react.email/docs/editor/*`.
- **Arquitectura:** documento TipTap (JSON) = estado. Cada tipo de nodo es un `EmailNode` (subclase de TipTap Node) con un renderer `renderToReactEmail`. El serializer `composeReactEmail({ editor })` recorre el JSON, construye árbol de componentes react-email reales (`<Section>`, `<Container>`…), lo envuelve en un `BaseTemplate` (personalizable vía `SerializerPlugin`, que también inyecta estilos por nodo con `getNodeStyles`) y llama `render()` → devuelve `{ html (pretty), unformattedHtml, text }`.
- **API:** `<EmailEditor content={htmlOJson} onUpdate onReady theme extensions onUploadImage />`; ref con `getEmailHTML()`, `getEmail()`, `getJSON()`. `content` acepta HTML **semántico propio del editor** o JSON TipTap.
- **Extensiones incluidas (35+):** body, container, section, columns (2–4), table, div, button, heading, paragraph, listas, divider, link, code-block, marks (bold/italic/underline/strike/sup/uppercase), y extensiones de preservación `style-attribute`, `class-attribute`, `alignment-attribute`, `preserved-style` (mantienen estilos/clases inline al importar/editar).
- **UI incluida:** bubble menu, slash commands (`/`), theming plugin, image upload plugin, y un **Inspector** completo (`ui/inspector`): árbol de documento, breadcrumb de nodo, secciones de edición Padding / Background / Border / Typography / Size / Attributes / Link / ColumnSpacing. O sea: mucho más cerca de un "builder" de lo que anuncia la landing.
- **Drag-and-drop:** el `create-drop-handler` solo gestiona **drop de archivos** (imágenes). No trae drag-handle para reordenar bloques out-of-the-box; se puede añadir con extensiones TipTap OSS (p.ej. `tiptap-extension-global-drag-handle`) porque los nodos ProseMirror soportan drag nativo.

### Límites clave del editor oficial (verificado en código)

1. **No importa el HTML compilado de react-email.** Los `parseHTML()` de sus extensiones reconocen su propio HTML semántico (ej. Section: `section[data-type="section"]`), no table-soup. Pegar/cargar `compiledHtml` degrada a párrafos.
2. **No importa ni exporta TSX.** Serializa JSON TipTap → árbol de elementos React en memoria → HTML. El TSX nunca existe como código.
3. Conclusión: **roundtrip con nuestro `componentCode` arbitrario = imposible sin capa propia.** Adoptarlo implica que el JSON TipTap (o su HTML semántico) pase a ser la fuente de verdad.

Dato colateral importante: **`@react-email/components` está deprecated en npm** ("Package no longer supported") — los componentes se consolidaron dentro del paquete `react-email` v5. Nuestro 1.0.12 funciona pero es rama muerta; migración a `react-email` v5 conviene independientemente de este proyecto.

## 4. Opciones

### Opción A — Adoptar `@react-email/editor`; JSON TipTap = nueva fuente de verdad
- Guardar `editorDoc` (JSON) en `EmailVariant`; `compiledHtml` sale de `composeReactEmail` (server-side headless posible: el serializer solo usa `editor.getJSON()` + schema; TipTap v3 corre headless — **verificar en spike**).
- IA deja de emitir TSX libre y emite **HTML semántico del editor** (h1/p/section/columns con style inline) o JSON TipTap validado con zod. Structured output = más fiable que TSX y **elimina el sandbox vm/RCE**.
- Theming de marca vía `SerializerPlugin` (BaseTemplate custom = donde van las media queries móviles actuales).
- Variables `{{merge}}`: sobreviven como texto (highlight actual sigue); mejor: extensión custom `EmailNode`/mark para chips de variable.
- Migración de emails existentes: convertidor one-shot TSX → HTML de editor (Babel parse del subset permitido; viable porque el guard ya restringe el lenguaje).
- **Pros:** mantenido por Resend, MIT, Inspector/slash/columns ya hechos, HTML email-safe garantizado, alineado con el ecosistema react-email, menos superficie de seguridad.
- **Contras:** espacio de diseño limitado al schema del editor → **riesgo directo para el anti-generic overhaul** (la IA pierde libertad de layout); migración grande de prompts + datos; DnD de bloques hay que añadirlo (extensión); dependencia de paquete v1.x joven.

### Opción B — TSX sigue siendo la verdad; instrumentación AST estilo Onlook/Plasmic
- Babel plugin en `compileComponent`: inyecta `data-m-id` (path del nodo JSX) a cada elemento **solo en compilación de preview** (se strip-ea al enviar). Los componentes react-email hacen spread de props → los `data-*` llegan al HTML.
- Preview con overlay click-to-select (postMessage desde iframe), breadcrumb, panel de estilos propio.
- Ediciones = parches AST sobre el TSX con **recast/magicast** (format-preserving): texto (JSXText/default de prop), estilos (mutar object literal `style`), mover/duplicar/borrar secciones (reordenar hijos JSX), insertar bloques (snippets). Drag-and-drop completo = HTML5 DnD sobre overlay → mover nodos AST.
- Referencia validada: **Onlook** (Apache-2.0, 26k★) hace exactamente esto para apps React (instrumenta código, mapea DOM→código, sync bidireccional).
- **Pros:** pipeline IA intacto (anti-generic se conserva), incremental, TSX única verdad, sin dependencia externa.
- **Contras:** construir editor UI completo (inspector, DnD, undo/redo) = esfuerzo mayor; JSX dinámico (`.map`, ternarios) no es editable visualmente → constrañir prompts a JSX estático o marcar nodos read-only; edge cases de codegen.

### Opción C — Modelo JSON de bloques propio (estilo EmailBuilder.js / Puck)
- Schema JSON Madoo → renderer JSON→react-email → editor DnD propio (o embeber **EmailBuilder.js**, MIT, `TReaderDocument`). IA emite JSON.
- **Contras:** reinventa lo que la Opción A ya da mantenido por Resend. Solo tendría sentido si quisiéramos control total del formato. Descartar.

### Opción D — Builder third-party completo (Unlayer / Easy Email / Maily)
- **Unlayer** (`react-email-editor` npm): propietario/SaaS, design JSON suyo, abandona react-email. **Easy Email**: MJML, poco mantenido. **Maily.to**: TipTap también, pero formato propio no-react-email.
- Misma migración que A pero sin alineación con nuestro stack. Descartar.

### Opción E — Quick wins sin cambiar arquitectura (fase 0)
Sobre el id-mapping mínimo de B (solo el Babel plugin + overlay):
1. **Click-to-select → editar con IA**: click en elemento del preview adjunta el nodo/contexto al chat; la IA parchea el TSX (flujo edit existente). Percepción de "edición visual" con esfuerzo pequeño.
2. **Edición inline de texto**: contenteditable sobre nodos de texto → write-back al literal en el AST (el 80% de las ediciones reales son copy).
3. **Swap de imagen al click**: ya existe sistema de variables/upload; solo falta el targeting visual.

## 5. Comparativa

| Opción | Esfuerzo | DnD completo | Compat pipeline IA actual | Fidelidad roundtrip | Riesgo |
|---|---|---|---|---|---|
| A editor oficial | Medio-alto (migración) | Añadible | Baja (IA cambia a JSON/HTML) | Total (verdad = JSON) | Schema limita diseño |
| B AST/Onlook | Alto (UI editor) | Sí (custom) | Total | Total (verdad = TSX) | Complejidad codegen |
| C JSON propio | Alto | Sí | Baja | Total | Reinventar rueda |
| D third-party | Medio | Sí | Nula | N/A (abandona react-email) | Lock-in/branding |
| E quick wins | **Bajo** | No | Total | Total | Mínimo |

## 6. Recomendación

1. **Fase 0 = Opción E** (días, no semanas): Babel plugin `data-m-id` + click-to-select + edición inline de texto + swap de imágenes. Valida demanda de edición manual sin apostar arquitectura.
2. **Decisión estratégica después:**
   - Si el producto necesita **builder manual completo** → **Opción A** (apuesta del ecosistema Resend, MIT, mantenido) aceptando re-alinear la generación IA al schema del editor.
   - Si la diferenciación sigue siendo **diseño IA libre (anti-generic)** → crecer **Opción B** encima de la fase 0 (estilos → mover secciones → DnD).
3. En paralelo, planificar migración `@react-email/components` (deprecated) → `react-email` v5.

## 7. Fuentes

- Docs editor: https://react.email/docs/editor/overview · getting-started
- Código: https://github.com/resend/react-email (canary) — `packages/editor/src/core/serializer/compose-react-email.tsx`, `email-node.ts`, `extensions/section.tsx`, `ui/inspector/`, `email-editor.tsx`, `core/create-drop-handler.ts`, `package.json` (MIT, TipTap v3)
- npm `@react-email/components` (deprecated flag): https://registry.npmjs.org/@react-email/components/latest
- Onlook: https://github.com/onlook-dev/onlook · EmailBuilder.js: https://github.com/usewaypoint/email-builder-js · Unlayer: https://github.com/unlayer/react-email-editor
