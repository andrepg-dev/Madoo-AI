import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  emailVerified: z.boolean(),
  hasPassword: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
