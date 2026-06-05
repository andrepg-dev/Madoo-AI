# 14 — Home subscreens on Design System (batch 3)

## Cambios

### `components/home/TemplateCard.tsx`

Solo swap del `Icon`: ahora viene de `@madoo/design-system`. El resto del card
(hover lift, gradient overlay del CTA, badge "PRO" gold-on-dark) se
mantiene custom: tiene comportamiento muy específico (transformación al
hover, overlay condicional con CTA dinámico premium/free) que el `Card`
genérico del DS no cubre.

### `components/home/GeneratingScreen.tsx`

Solo swap del `Icon` a `@madoo/design-system`. Se mantienen el círculo accent con
sparkle giratoria + animación pulse, y el listado de pasos con checks
animados — son piezas one-off de marketing, no primitivas reutilizables.

### `components/home/EditorScreen.tsx`

- Botones de la toolbar superior (Back, Copy, Send test) → `<Button
  variant="secondary"|"primary" size="sm" leftIcon>`.
- Selector de variantes "v1/v2/v3" (botones cuadrados con activo en
  ink) → `<SegmentedControl items value onChange>`. La data es un map
  de los `subjects` a `{value: String(i), label: vN+1}`.
- Suggestion box accent (sparkle + texto) → `<Banner tone="accent"
  title="Suggestion">`.
- Quick edits (lista vertical con flecha a la derecha) → `<Button
  variant="secondary" size="sm" block rightIcon={<Icon "arrow">}>` con
  `justifyContent: space-between` para alinear texto-flecha.
- Bottom AI prompt (textarea con botón send absolute) → `<Textarea
  variant="filled" noResize>` + `<IconButton variant="solid">`
  posicionado absolute.

Lo que se mantiene custom:

- Subject input grande inline en la toolbar (es un input "fantasma" sin
  borde ni padding, no encaja con `Input` del DS).
- Layout grid (Single column / Two column / Hero + grid / Minimal): son
  4 botones simples con borde más grueso en el activo. `SelectableCard`
  del DS funcionaría pero su look-and-feel es de tarjeta con padding y
  título; aquí queremos pills compactas. Pendiente de evaluar en otra
  pasada.
- Email preview render (todo el bloque `aspectRatio 16/9`, hero, body,
  CTA "Read more →", footer): es contenido dinámico templateado, no UI
  reutilizable.
- Header del aside "AI Editor" con sparkle en cuadrado accent: chrome
  one-off.

## Pendiente

- Próximo batch (4): pantallas de feature
  (`AnalyticsScreen`, `CampaignsScreen`, `ContactsScreen`,
  `DomainScreen`).
