import { z } from "zod";

export const SendTestEmailInputSchema = z.object({
  to: z.string().email().optional(),
  /**
   * Color scheme to force on the sent HTML. "auto" (default) sends the email
   * as-is and lets the recipient's client decide; "light"/"dark" hard-apply
   * the matching prefers-color-scheme overrides before sending.
   */
  scheme: z.enum(["auto", "light", "dark"]).optional(),
});

export type SendTestEmailInput = z.infer<typeof SendTestEmailInputSchema>;

export const SendTestEmailResponseSchema = z.object({
  ok: z.literal(true),
  to: z.string().email(),
  skipped: z.boolean(),
});

export type SendTestEmailResponse = z.infer<
  typeof SendTestEmailResponseSchema
>;

/**
 * Public (unauthenticated) test send from the landing page: a visitor mails
 * themselves a community template to check how it renders in their client.
 */
export const PublicTemplateTestSendSchema = z.object({
  to: z.string().email(),
});

export type PublicTemplateTestSendInput = z.infer<
  typeof PublicTemplateTestSendSchema
>;

export const PublicTemplateTestSendResponseSchema = z.object({
  ok: z.literal(true),
  to: z.string().email(),
  skipped: z.boolean(),
});

export type PublicTemplateTestSendResponse = z.infer<
  typeof PublicTemplateTestSendResponseSchema
>;

/** One link discovered in the email and the result of probing it. */
export const LinkCheckSchema = z.object({
  url: z.string(),
  label: z.string(),
  kind: z.enum(["http", "mailto", "tel", "anchor", "other"]),
  status: z.number().nullable(),
  ok: z.boolean(),
  hasUtm: z.boolean(),
  error: z.string().nullable(),
});

export type LinkCheck = z.infer<typeof LinkCheckSchema>;

export const TestLinksResponseSchema = z.object({
  total: z.number(),
  ok: z.number(),
  broken: z.number(),
  checkedAt: z.string(),
  links: z.array(LinkCheckSchema),
});

export type TestLinksResponse = z.infer<typeof TestLinksResponseSchema>;

/** One deliverability/spam heuristic and whether the email passed it. */
export const SpamIssueSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  passed: z.boolean(),
});

export type SpamIssue = z.infer<typeof SpamIssueSchema>;

export const TestSpamResponseSchema = z.object({
  score: z.number(),
  rating: z.enum(["good", "warning", "poor"]),
  summary: z.string(),
  issues: z.array(SpamIssueSchema),
});

export type TestSpamResponse = z.infer<typeof TestSpamResponseSchema>;
