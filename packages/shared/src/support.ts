import { z } from "zod";

export const SupportCategorySchema = z.enum([
  "ACCOUNT",
  "WORKSPACE",
  "BILLING",
  "GENERATION",
  "EXPORT",
  "OTHER",
]);

export type SupportCategory = z.infer<typeof SupportCategorySchema>;

export const SupportTicketStatusSchema = z.enum(["OPEN", "CLOSED"]);

export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

export const CreateSupportTicketInputSchema = z.object({
  contactEmail: z.string().email(),
  category: SupportCategorySchema,
  subject: z.string().min(3).max(140),
  message: z.string().min(10).max(5000),
  workspaceId: z.string().min(1).optional(),
  emailId: z.string().min(1).optional(),
});

export type CreateSupportTicketInput = z.infer<
  typeof CreateSupportTicketInputSchema
>;

export const SupportTicketSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1).nullable(),
  emailId: z.string().min(1).nullable(),
  userId: z.string().min(1),
  contactEmail: z.string().email(),
  category: SupportCategorySchema,
  subject: z.string().min(1),
  message: z.string().min(1),
  status: SupportTicketStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
