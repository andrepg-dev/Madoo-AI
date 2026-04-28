# 15 — Feature screens on Design System (batch 4)

## Cambios

### `components/analytics/AnalyticsScreen.tsx`

- 4 stat cards (Delivered/Opens/Clicks/Unsubscribed) → `<Card padded>`
  con la barrita superior de color custom encima (cada una con su
  accent dedicado, no es un dato de tono semántico).
- "7 days / 30 days / All time" pill segmented → `<SegmentedControl
  variant="minimal">`. Quedó controlado con `useState`.
- "Top clicked links" y "Where they read it" → `<Card padded>` y las
  barras 4px → `<ProgressBar variant="thin">`.
- Chart SVG de opens-over-time se mantiene custom (es un viz one-off,
  no hay primitivo).

### `components/campaigns/CampaignsScreen.tsx`

- "New campaign" → `<Button variant="primary" leftIcon={sparkle}>`.
- 4 stat cards → `<Card padded>`.
- Pill de filtros (All/Drafts/Scheduled/Sending/Sent) →
  `<SegmentedControl>`.
- Wrapper de la tabla → `<Card>` (sin padded, los rows pintan su propio
  padding).
- Status pill de cada campaign → `<Badge tone dot>` mapeado por status:
  sent→success, sending→warn, scheduled→info, draft→neutral.

### `components/contacts/ContactsScreen.tsx`

- Botón "+" arriba de SEGMENTS → `<IconButton variant="soft" size="sm">`.
- "Try it →" del smart segment → `<Button variant="accent" size="sm">`.
- "Import CSV" / "Add contact" → `<Button variant="secondary"|"primary">`.
- Search bar custom (input + lupa absolute) → `<Input variant="filled"
  inputSize="sm" startAdornment={<Icon search>}>`.
- "Filter" → `<Button variant="secondary" leftIcon={sliders}>`.
- "Add tag" / "Send campaign →" en el strip de seleccion →
  `<Button>`.
- Checkboxes de la tabla (incluyendo el header) → `<Checkbox>` del DS.
- Tags pills de cada contact → `<Tag tone="neutral" size="sm" sans>`.
- Status pills → `<Badge tone dot>` mapeado: active→success,
  unsubscribed→neutral, bounced→danger.

Lo que se mantiene custom: la lista de SEGMENTS del aside (cada item
tiene swatch + nombre + count, comportamiento muy específico) y la
barrita de engagement (gradiente custom según `c.opens`).

### `components/domain/DomainScreen.tsx`

- Las 3 cards principales (status del dominio, DNS records, sender
  identity) → `<Card padded>`.
- "Re-check" / "Copy all" → `<Button variant="secondary" size="sm">`.
- Status pills del dominio y de cada DNS record → `<Badge tone dot>`
  (success/warn).
- Type del DNS record (TXT/CNAME) → `<Tag tone="neutral" size="sm">`.
- "From name" / "From email" inputs → `<Input variant="filled" label>`
  del DS, con label semántico (antes era un eyebrow manual + input
  pelado).

## Pendiente

- Próximo batch (5): el monstruo `ComposeModal` (963 LOC) y
  `TemplatePreview`.
