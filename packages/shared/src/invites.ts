import { z } from "zod";
import { MyWorkspaceSchema } from "./workspace";

export const WorkspaceInviteRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export type WorkspaceInviteRole = z.infer<typeof WorkspaceInviteRoleSchema>;

export const CreateWorkspaceInviteInputSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase())
    .optional()
    .or(z.literal("").transform(() => undefined)),
  role: WorkspaceInviteRoleSchema,
});

export type CreateWorkspaceInviteInput = z.infer<
  typeof CreateWorkspaceInviteInputSchema
>;

export const WorkspaceInviteUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable(),
});

export type WorkspaceInviteUser = z.infer<typeof WorkspaceInviteUserSchema>;

export const WorkspaceInviteSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  email: z.string().email().nullable(),
  role: WorkspaceInviteRoleSchema,
  token: z.string().min(1),
  inviteUrl: z.string().url(),
  invitedBy: WorkspaceInviteUserSchema,
  acceptedBy: WorkspaceInviteUserSchema.nullable(),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type WorkspaceInvite = z.infer<typeof WorkspaceInviteSchema>;

export const WorkspaceInvitePreviewSchema = z.object({
  token: z.string().min(1),
  workspace: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    avatarUrl: z.string().url().nullable(),
  }),
  inviter: WorkspaceInviteUserSchema,
  email: z.string().email().nullable(),
  role: WorkspaceInviteRoleSchema,
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
});

export type WorkspaceInvitePreview = z.infer<
  typeof WorkspaceInvitePreviewSchema
>;

export const AcceptWorkspaceInviteResponseSchema = z.object({
  workspace: MyWorkspaceSchema,
});

export type AcceptWorkspaceInviteResponse = z.infer<
  typeof AcceptWorkspaceInviteResponseSchema
>;
