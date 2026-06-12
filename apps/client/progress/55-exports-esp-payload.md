# 55 — Phase 7B: ESP exports + automation payload

Date: 2026-06-11

## Goal

Make the export modal's **Providers** tab (11 ESPs) and the non-mailbox
**Application** cards (Zapier/Make/n8n/Webhook/Google Cloud) functional. No ESP
APIs — downloadable ESP-ready HTML with platform-correct merge tags, plus a
generic JSON payload for automation tools.

## Backend

- New `src/exports/esp-merge-tags.ts`: `ESP_MERGE_TAGS` formats a variable name
  into each platform's native merge tag:
  - Mailchimp `*|NAME|*`, Klaviyo `{{ name }}`, HubSpot `{{ contact.x }}`,
    Brevo `{{ contact.X }}`, MailerLite `{$x}`, ConvertKit `{{ subscriber.x }}`,
    ActiveCampaign `%X%`, Customer.io `{{ customer.x }}`, Braze `{{${x}}}`,
    Marketo `{{lead.X}}`, Salesforce `%%x%%`.
- `ExportsService`:
  - `exportEsp(provider)` — builds props (dynamic vars → provider merge tag,
    static vars keep defaults), re-renders via
    `ReactToHtmlService.compileComponent` + `renderComponent`, then `juice`.
  - `exportPayload()` — `{ emailId, subject, html (inlined), variables[] }`.
- `ExportsController`:
  - `GET :id/export/esp?provider=&variantId=` → ESP HTML attachment.
  - `GET :id/export/payload?variantId=` → JSON attachment.

## Client

- New `lib/export-instructions.ts`:
  - `ESP_INSTRUCTIONS` (per-provider paste steps), `ESP_NAME_TO_PROVIDER`
    (display name → slug), `AUTOMATION_INSTRUCTIONS` (Zapier/Make/n8n/Webhook/
    Google Cloud).
- `ExportProviderModal`:
  - Providers tab cards → download ESP HTML via proxy + success toast carrying
    paste instructions.
  - Application non-mailbox cards → download payload JSON + instructions toast.

## Verification

- `tsc` clean across shared/backend/client.
- Smoke pending servers: Mailchimp download contains `*|...|*`; payload JSON has subject/html/variables.
