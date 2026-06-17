import { z } from "zod";

/** File export formats served as downloadable attachments. */
export const ExportFileFormatSchema = z.enum(["html", "png", "jpeg", "pdf"]);
export type ExportFileFormat = z.infer<typeof ExportFileFormatSchema>;

/** Image raster formats accepted by the image export route. */
export const ExportImageFormatSchema = z.enum(["png", "jpeg"]);
export type ExportImageFormat = z.infer<typeof ExportImageFormatSchema>;

/**
 * ESP providers we generate ESP-ready HTML for (merge tags swapped per-platform).
 * No ESP APIs are called — the output is a downloadable HTML file.
 */
export const EspProviderSchema = z.enum([
  "mailchimp",
  "klaviyo",
  "hubspot",
  "brevo",
  "mailerlite",
  "convertkit",
  "activecampaign",
  "customerio",
  "braze",
  "marketo",
  "salesforce",
]);
export type EspProvider = z.infer<typeof EspProviderSchema>;

/** Generic automation/webhook payload returned for Zapier/Make/n8n/Webhook/Google Cloud. */
export const ExportPayloadDtoSchema = z.object({
  emailId: z.string(),
  subject: z.string(),
  html: z.string(),
  variables: z.array(
    z.object({
      name: z.string(),
      label: z.string().optional(),
      default: z.string(),
      role: z.enum(["text", "url", "image", "date"]).optional(),
      scope: z.enum(["dynamic", "static"]).optional(),
    }),
  ),
});
export type ExportPayloadDto = z.infer<typeof ExportPayloadDtoSchema>;
