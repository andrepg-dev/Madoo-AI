import { z } from "zod";

export const RoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type Role = z.infer<typeof RoleSchema>;
