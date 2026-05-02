import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime();

export const ContactStatusSchema = z.enum([
  "active",
  "unsubscribed",
  "bounced",
  "complained",
]);

export const TagSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
});

export const ContactSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: ContactStatusSchema,
  customFields: z.record(z.string(), z.string()),
  tags: z.array(TagSchema).default([]),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const SegmentQuerySchema = z.object({
  tags: z.array(z.string()).optional(),
  status: ContactStatusSchema.optional(),
  createdAfter: IsoDateTimeSchema.optional(),
  createdBefore: IsoDateTimeSchema.optional(),
  lastOpenAfter: IsoDateTimeSchema.optional(),
});

export const SegmentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1),
  query: SegmentQuerySchema,
  createdAt: IsoDateTimeSchema,
});

export const SegmentFromPromptInputSchema = z.object({
  prompt: z.string().min(1),
});

export const SegmentPreviewSchema = z.object({
  count: z.number().int().nonnegative(),
  sampleContacts: z.array(ContactSchema),
});

export const SegmentFromPromptPreviewSchema = z.object({
  name: z.string().min(1),
  query: SegmentQuerySchema,
  count: z.number().int().nonnegative(),
  sampleContacts: z.array(ContactSchema),
});

export const SuppressionReasonSchema = z.enum([
  "unsubscribed",
  "hard_bounce",
  "complained",
]);

export const SuppressionEntrySchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  reason: SuppressionReasonSchema,
  createdAt: IsoDateTimeSchema,
});

export type ContactStatus = z.infer<typeof ContactStatusSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type SegmentQuery = z.infer<typeof SegmentQuerySchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type SegmentFromPromptInput = z.infer<typeof SegmentFromPromptInputSchema>;
export type SegmentPreview = z.infer<typeof SegmentPreviewSchema>;
export type SegmentFromPromptPreview = z.infer<typeof SegmentFromPromptPreviewSchema>;
export type SuppressionReason = z.infer<typeof SuppressionReasonSchema>;
export type SuppressionEntry = z.infer<typeof SuppressionEntrySchema>;
