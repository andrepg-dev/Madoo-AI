import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime();

export const CampaignStatusSchema = z.enum(["draft", "scheduled", "sending", "sent"]);
export const CampaignDeliveryStatusSchema = z.enum([
  "pending",
  "sent",
  "opened",
  "clicked",
  "bounced",
  "unsubscribed",
  "complained",
]);

export const CampaignVariableMappingSchema = z.record(z.string(), z.string());

export const CampaignSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  emailId: z.string().min(1),
  segmentId: z.string().min(1),
  status: CampaignStatusSchema,
  scheduledFor: IsoDateTimeSchema.optional(),
  sentAt: IsoDateTimeSchema.optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  abTest: z.boolean(),
  variableMapping: CampaignVariableMappingSchema.default({}),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CampaignDeliverySchema = z.object({
  id: z.string().min(1),
  campaignId: z.string().min(1),
  contactId: z.string().min(1),
  messageId: z.string().optional(),
  status: CampaignDeliveryStatusSchema,
  sentAt: IsoDateTimeSchema.optional(),
  openedAt: IsoDateTimeSchema.optional(),
  clickedAt: IsoDateTimeSchema.optional(),
  bouncedAt: IsoDateTimeSchema.optional(),
  unsubscribedAt: IsoDateTimeSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

/** One recipient row for a campaign (delivery + contact fields). */
export const CampaignRecipientSchema = z.object({
  deliveryId: z.string().min(1),
  contactId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  status: CampaignDeliveryStatusSchema,
  sentAt: IsoDateTimeSchema.optional(),
});

export const CreateCampaignInputSchema = z.object({
  emailId: z.string().min(1),
  segmentId: z.string().min(1),
  fromName: z.string().min(1).max(120),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  abTest: z.boolean().default(false),
  scheduledFor: IsoDateTimeSchema.optional(),
  variableMapping: CampaignVariableMappingSchema.optional().default({}),
});

export const UpdateCampaignInputSchema = CreateCampaignInputSchema.partial();

export const CampaignSendTestResponseSchema = z.object({
  ok: z.literal(true),
  messageId: z.string().nullable(),
});

export const CampaignEnqueueSendResponseSchema = z.object({
  ok: z.literal(true),
  queued: z.literal(true),
});

export type CampaignSendTestResponse = z.infer<typeof CampaignSendTestResponseSchema>;
export type CampaignEnqueueSendResponse = z.infer<typeof CampaignEnqueueSendResponseSchema>;

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type CampaignDeliveryStatus = z.infer<typeof CampaignDeliveryStatusSchema>;
export type CampaignVariableMapping = z.infer<typeof CampaignVariableMappingSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignDelivery = z.infer<typeof CampaignDeliverySchema>;
export type CampaignRecipient = z.infer<typeof CampaignRecipientSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;
