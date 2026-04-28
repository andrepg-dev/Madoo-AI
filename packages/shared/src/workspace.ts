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
