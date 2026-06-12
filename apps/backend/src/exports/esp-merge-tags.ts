import type { EspProvider } from "@madoo/shared";

/**
 * Per-ESP merge-tag formatters. Each turns a variable name (a valid JS
 * identifier, e.g. `firstName`) into the platform-correct dynamic placeholder
 * string. Output is embedded as a React prop value, then rendered to static
 * HTML — so the ESP sees its own native merge tag where dynamic data goes.
 *
 * No ESP APIs are used; this only shapes downloadable HTML.
 */
export type MergeTagFormatter = (variableName: string) => string;

const upper = (name: string) => name.toUpperCase();

export const ESP_MERGE_TAGS: Record<EspProvider, MergeTagFormatter> = {
  mailchimp: (name) => `*|${upper(name)}|*`,
  klaviyo: (name) => `{{ ${name} }}`,
  hubspot: (name) => `{{ contact.${name} }}`,
  brevo: (name) => `{{ contact.${upper(name)} }}`,
  mailerlite: (name) => `{$${name}}`,
  convertkit: (name) => `{{ subscriber.${name} }}`,
  activecampaign: (name) => `%${upper(name)}%`,
  customerio: (name) => `{{ customer.${name} }}`,
  braze: (name) => `{{\${${name}}}}`,
  marketo: (name) => `{{lead.${upper(name)}}}`,
  salesforce: (name) => `%%${name}%%`,
};

export const ESP_LABELS: Record<EspProvider, string> = {
  mailchimp: "Mailchimp",
  klaviyo: "Klaviyo",
  hubspot: "HubSpot",
  brevo: "Brevo",
  mailerlite: "MailerLite",
  convertkit: "ConvertKit",
  activecampaign: "ActiveCampaign",
  customerio: "Customer.io",
  braze: "Braze",
  marketo: "Marketo",
  salesforce: "Salesforce",
};
