# 16 — ComposeModal on Design System (batch 5)

## Cambios

### `components/campaigns/ComposeModal.tsx`

Reescritura completa: 963 LOC → ~530 LOC. El modal de 5 pasos ahora
vive dentro de `<Modal size="lg" eyebrow title footer>` del DS, lo que
elimina manejo manual de overlay/escape/click-fuera/close button.

Por step:

- **Header progress bar** (3px accent fill): `<ProgressBar value
  variant="thin">` calculando `(step / 5) * 100`.
- **Step 1 — Choose email**: el card "Generate with AI" y los drafts
  con thumbnail+check siguen custom (estructura específica con
  TemplatePreview a la izquierda, info al medio, check al final).
- **Step 2 — Choose audience**: lista de segments también custom
  (swatch de color + nombre + count + check), por la misma razón.
- **Step 3 — Map variables**:
  - Banner explicativo arriba → `<Banner tone="accent">`.
  - `<select>` de Contact field → `<Select selectSize="sm" options>`
    del DS.
  - `<input>` de fallback → `<Input inputSize="sm">`.
  - Pills "X missing" / "not mapped" → `<Tag tone="warn"|"danger"
    size="sm" sans>`.
  - Sugerencias clickables → `<Button variant="secondary" size="sm">`.
  - Panel "Preview as": `<Select label>` para elegir contacto preview.
  - El bloque del token (`{Nombre}` etc.) y el preview body son markup
    propio.
- **Step 4 — Schedule**:
  - Las dos cards "Send now" / "Schedule for later" → `<SelectableCard
    padded selected onClick title description>`. Mucho más limpio que
    los buttons custom anteriores.
  - Date/Time inputs → `<Input label type="date|time">`.
  - Bloque AB test (checkbox + descripción accent) → `<Banner
    tone="accent">` envolviendo un `<Checkbox label description>` del
    DS.
- **Step 5 — Review**:
  - Bloque AI prediction → `<Banner tone="accent" title="AI
    prediction">`.
  - El header del review con thumbnail + nombre/subject y la lista
    key-value se mantienen custom (es content específico de revisión).

Footer Cancel/Back/Continue/Send → `<Button>` (`variant="secondary"`
para Cancel/Back, `variant="primary"` para Continue/Send con icon
condicional).

## Pendiente

- Próximo batch (6): cleanup — borrar
  `apps/frontend/components/icons/Icon.tsx` y
  `apps/frontend/components/home/PromptPill.tsx` (ya nadie los usa).
