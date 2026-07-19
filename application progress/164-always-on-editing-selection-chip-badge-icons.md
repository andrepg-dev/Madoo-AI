# 164 — Always-on visual editing, selection chip in chat, badge icons, background-image headers, static image variables

## What changed

### 1. Visual edit mode is always on (client)
- Removed the Edit toggle entirely: no more edit vs. non-edit mode in the preview.
- `apps/client/app/email-template-project/page.tsx`: dropped `visualEditOn` state; the tagged-HTML query now loads whenever a variant exists and no stream is running. The `visualEdit` controller lost `enabled`/`onToggle`.
- `apps/client/components/project/editor/EmailPreviewSidebar.tsx`: Edit button removed (a small "Saving" spinner appears in its place while autosaves run), dblclick-to-enter-edit-mode effect removed, "entering edit mode closes variables panel" effect removed.
- `apps/client/components/project/editor/useVisualEditSelection.ts`: `onExitEditMode` removed — double-clicking empty space just clears the selection now.
- Pending debounced visual edits are flushed at the start of every chat submit so the AI edits the exact document the user sees.

### 2. Selected element shown in the user chat message
- New nullable column `EmailChatMessage.selectedElementLabel` (migration `20260719105913_add_chat_selected_element_label`).
- `runEdit` stores `selectedElement.label` on the persisted USER message; `listChatMessages` returns it; shared `EmailChatMessageDtoSchema` carries it.
- Client renders a `Editing <p> "…"` chip above the user bubble (`HumanMessage`), both optimistically at send time and after reload from the DB.

### 3. Image variables can never be dynamic
- Prompt rule: image variables (role=image) are ALWAYS scope=static; never dynamic.
- Hard guard in `sanitizeGeneratedVariableSchema` (generation.util.ts): any role=image variable emitted with scope=dynamic is forced to static.

### 4. Background-image headers used more often
- New BACKGROUND-IMAGE HEADERS prompt rule: prefer a Section with inline `backgroundImage` + overlaid headline/CTA for promos, launches, events, lifestyle briefs; always with a contrast-safe `backgroundColor` fallback (Outlook strips CSS background images); plain `<Img>` heroes stay for product shots/transactional emails.

### 5. Second icon style: badge ("shaped") icons
- Evaluated lucide: it is stroke-outline like Hugeicons — adds no visual variety. A true solid fill of the Hugeicons paths loses interior detail (check/calendar/mail become blobs) — rejected after rendering a comparison sheet.
- Shipped `style: "outline" | "badge"` on `get_email_icons`: badge renders the glyph reversed out of a filled circle, with optional `color` (6-digit hex, typically the brand accent) for the circle; glyph auto-contrasts white/dark via luminance. Cached in S3 as `email-icons/v1/<name>-badge-<hex>.png`.
- Prompt guides the model to pick ONE style per email; badge for feature rows/consumer briefs, outline for minimal/editorial.

## Testing
- Backend: `npm test` 59/59 (added badge cache-key spec), `tsc --noEmit` clean.
- Client: `tsc --noEmit` clean, `next build` succeeds.
- Live end-to-end on localhost (fresh test user): generated a Nimbus launch email — hero rendered as a background-image section with overlaid headline + CTA, three feature rows used orange badge icons matching the palette, and every variable (including heroImage) came out static. Clicking an element selects it instantly with toolbar + Design panel (no toggle), Ask AI chip appeared above the prompt, the sent user message displayed the `Editing <p> "Hyperlocal trail forecasts"` chip, the targeted heading was edited, and the chip survived a full page reload.
