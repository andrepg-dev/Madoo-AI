import { z } from "zod";
import { UserSchema } from "./user";
import { MyWorkspaceSchema } from "./workspace";

export const GoogleLoginInputSchema = z.object({
  idToken: z.string().min(1),
  pendingPrompt: z.string().optional(),
  pendingTone: z.string().optional(),
  pendingLength: z.string().optional(),
  pendingAudience: z.string().optional(),
});
export type GoogleLoginInput = z.infer<typeof GoogleLoginInputSchema>;

export const GoogleLoginResponseSchema = z.object({
  token: z.string().min(1),
  user: UserSchema,
  pendingPromptId: z.string().nullable(),
  workspaces: z.array(MyWorkspaceSchema),
  defaultWorkspaceId: z.string().min(1),
});
export type GoogleLoginResponse = z.infer<typeof GoogleLoginResponseSchema>;
