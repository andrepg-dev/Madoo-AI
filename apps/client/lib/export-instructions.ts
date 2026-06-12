import type { EspProvider } from "@madoo/shared";

/**
 * Per-platform paste instructions shown after an ESP-ready HTML file is
 * downloaded. No ESP APIs are involved — the user uploads/pastes the file.
 */
export const ESP_INSTRUCTIONS: Record<EspProvider, string[]> = {
  mailchimp: [
    "In Mailchimp, create a campaign and choose Code your own → Paste in code.",
    "Paste the downloaded HTML. Merge tags use *|FIELD|* format.",
  ],
  klaviyo: [
    "In Klaviyo, create a template and switch to the HTML editor.",
    "Paste the HTML. Dynamic fields use {{ field }} syntax.",
  ],
  hubspot: [
    "In HubSpot, use Marketing → Email → custom-coded template.",
    "Paste the HTML. Personalization tokens use {{ contact.field }}.",
  ],
  brevo: [
    "In Brevo, create a campaign and pick the Code your own editor.",
    "Paste the HTML. Contact attributes use {{ contact.FIELD }}.",
  ],
  mailerlite: [
    "In MailerLite, add a Custom HTML block or use the HTML editor.",
    "Paste the HTML. Personalization uses {$field} syntax.",
  ],
  convertkit: [
    "In ConvertKit (Kit), create a broadcast and open the HTML source.",
    "Paste the HTML. Liquid fields use {{ subscriber.field }}.",
  ],
  activecampaign: [
    "In ActiveCampaign, choose the HTML template editor.",
    "Paste the HTML. Personalization tags use %FIELD% format.",
  ],
  customerio: [
    "In Customer.io, create a broadcast/newsletter with the code editor.",
    "Paste the HTML. Liquid attributes use {{ customer.field }}.",
  ],
  braze: [
    "In Braze, create an email campaign and open the HTML editor.",
    "Paste the HTML. Personalization uses {{${field}}} Liquid syntax.",
  ],
  marketo: [
    "In Marketo, create an email asset from a custom HTML template.",
    "Paste the HTML. Tokens use {{lead.Field}} format.",
  ],
  salesforce: [
    "In Salesforce Marketing Cloud, paste into an HTML content block.",
    "Personalization uses %%field%% AMPscript-style merge fields.",
  ],
};

/** Maps the modal's display names to ESP provider slugs. */
export const ESP_NAME_TO_PROVIDER: Record<string, EspProvider> = {
  Mailchimp: "mailchimp",
  Klaviyo: "klaviyo",
  HubSpot: "hubspot",
  Brevo: "brevo",
  MailerLite: "mailerlite",
  ConvertKit: "convertkit",
  ActiveCampaign: "activecampaign",
  "Customer.io": "customerio",
  Braze: "braze",
  Marketo: "marketo",
  Salesforce: "salesforce",
};

/** Paste/import instructions for automation + webhook payload downloads. */
export const AUTOMATION_INSTRUCTIONS: Record<string, string[]> = {
  Zapier: [
    "Download the JSON payload (subject, html, variables).",
    "In Zapier, use a Webhooks/Code step and map the fields into your email action.",
  ],
  Make: [
    "Download the JSON payload.",
    "In Make, parse the JSON and feed subject/html into your mail module.",
  ],
  "n8n.io": [
    "Download the JSON payload.",
    "In n8n, import the JSON in a Set/Function node, then pass to an email node.",
  ],
  Webhook: [
    "Download the JSON payload.",
    "POST it to your endpoint; the body contains subject, html, and variables.",
  ],
  "Google Cloud": [
    "Download the JSON payload.",
    "Use it with Cloud Functions / Pub/Sub to trigger your own send pipeline.",
  ],
};
