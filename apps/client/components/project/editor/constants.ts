import { Copy01Icon, Download01Icon, SourceCodeIcon } from "@hugeicons/core-free-icons";
import type { ExportFileFormat, ExportProvider } from "./types";

export const minPreviewWidthVw = 52;
export const defaultPreviewWidthVw = 64;
export const maxPreviewWidthVw = 78;
export const previewModeItems = [
  { value: "desktop", label: "Desktop" },
  { value: "responsive", label: "Responsive" },
];

export const emailExportProviders: readonly ExportProvider[] = [
  {
    name: "Mailchimp",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    name: "Klaviyo",
    iconSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    name: "HubSpot",
    iconSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    name: "Brevo",
    iconSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    name: "MailerLite",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
  },
  {
    name: "ConvertKit",
    iconSrc: "https://www.google.com/s2/favicons?domain=convertkit.com&sz=64",
  },
  {
    name: "ActiveCampaign",
    iconSrc: "https://www.google.com/s2/favicons?domain=activecampaign.com&sz=64",
  },
  {
    name: "Customer.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=customer.io&sz=64",
  },
  {
    name: "Braze",
    iconSrc: "https://www.google.com/s2/favicons?domain=braze.com&sz=64",
  },
  {
    name: "Marketo",
    iconSrc: "https://www.google.com/s2/favicons?domain=marketo.com&sz=64",
  },
  {
    name: "Salesforce",
    iconSrc: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=64",
  },
] as const;

export const applicationExportProviders: readonly ExportProvider[] = [
  {
    name: "Gmail",
    iconSrc: "https://www.google.com/s2/favicons?domain=gmail.com&sz=128",
  },
  {
    name: "Google Cloud",
    iconSrc: "https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128",
    badge: "fast",
  },
  {
    name: "Make",
    iconSrc: "https://www.google.com/s2/favicons?domain=make.com&sz=128",
  },
  {
    name: "n8n.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=n8n.io&sz=128",
  },
  {
    name: "Outlook App",
    iconSrc: "https://www.google.com/s2/favicons?domain=outlook.com&sz=128",
  },
  {
    name: "Outlook Web",
    iconSrc: "https://www.google.com/s2/favicons?domain=office.com&sz=128",
  },
  {
    name: "Webhook",
    iconSrc: "https://www.google.com/s2/favicons?domain=webhook.site&sz=128",
  },
  {
    name: "Zapier",
    iconSrc: "https://www.google.com/s2/favicons?domain=zapier.com&sz=128",
  },
] as const;

export const fileExportFormats: readonly ExportFileFormat[] = [
  {
    name: "Copy HTML",
    description: "Copy production HTML to clipboard",
    icon: Copy01Icon,
  },
  {
    name: "HTML",
    description: "Production email HTML",
    icon: SourceCodeIcon,
  },
  {
    name: "Image",
    description: "Static preview image",
    icon: Download01Icon,
  },
  {
    name: "PDF",
    description: "Shareable document",
    icon: Download01Icon,
  },
] as const;
