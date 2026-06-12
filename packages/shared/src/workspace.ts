import { z } from "zod";
import { RoleSchema } from "./role";

export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "slug must be lowercase, dash-separated"),
  templateCreationReason: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceMembershipSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  role: RoleSchema,
  createdAt: z.string().datetime(),
});

export type WorkspaceMembership = z.infer<typeof WorkspaceMembershipSchema>;

export const MyWorkspaceSchema = WorkspaceSchema.extend({
  role: RoleSchema,
});

export type MyWorkspace = z.infer<typeof MyWorkspaceSchema>;

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().min(1).max(80),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const UpdateWorkspaceMeInputSchema = z.object({
  templateCreationReason: z.string().min(1).max(80).optional(),
});

export type UpdateWorkspaceMeInput = z.infer<typeof UpdateWorkspaceMeInputSchema>;

export const UpdateWorkspaceInputSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    slug: z
      .string()
      .min(1)
      .max(64)
      .regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        "slug must be lowercase, dash-separated",
      )
      .optional(),
  })
  .refine((v) => v.name !== undefined || v.slug !== undefined, {
    message: "Provide at least one field to update.",
  });

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInputSchema>;

export const WorkspaceMemberSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: RoleSchema,
  joinedAt: z.string().datetime(),
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const UpdateMemberRoleInputSchema = z.object({
  role: RoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleInputSchema>;
