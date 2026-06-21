import { z } from "zod";
import { UserSchema } from "./user";
import { MyWorkspaceSchema } from "./workspace";
import { ReferralCodeFields } from "./referrals";

const PendingPromptFields = {
  pendingPrompt: z.string().optional(),
  pendingTone: z.string().optional(),
  pendingLength: z.string().optional(),
  pendingAudience: z.string().optional(),
};

export const GoogleLoginInputSchema = z.object({
  idToken: z.string().min(1),
  ...PendingPromptFields,
  ...ReferralCodeFields,
});
export type GoogleLoginInput = z.infer<typeof GoogleLoginInputSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  ...PendingPromptFields,
  ...ReferralCodeFields,
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const PasswordLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  ...PendingPromptFields,
});
export type PasswordLoginInput = z.infer<typeof PasswordLoginInputSchema>;

export const GithubLoginInputSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
  ...PendingPromptFields,
  ...ReferralCodeFields,
});
export type GithubLoginInput = z.infer<typeof GithubLoginInputSchema>;

export const AuthSessionResponseSchema = z.object({
  token: z.string().min(1),
  user: UserSchema,
  pendingPromptId: z.string().nullable(),
  workspaces: z.array(MyWorkspaceSchema),
  defaultWorkspaceId: z.string().min(1),
});
export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;

// Back-compat aliases (apps/frontend imports these names).
export const GoogleLoginResponseSchema = AuthSessionResponseSchema;
export type GoogleLoginResponse = AuthSessionResponse;

export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const UpdateUserMeInputSchema = z.object({
  name: z.string().min(1).max(120),
});
export type UpdateUserMeInput = z.infer<typeof UpdateUserMeInputSchema>;

export const AuthProviderKindSchema = z.enum(["GOOGLE", "GITHUB", "APPLE"]);
export type AuthProviderKind = z.infer<typeof AuthProviderKindSchema>;

export const ConnectedAccountSchema = z.object({
  provider: AuthProviderKindSchema,
  email: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ConnectedAccount = z.infer<typeof ConnectedAccountSchema>;

export const ConnectedAccountsResponseSchema = z.object({
  accounts: z.array(ConnectedAccountSchema),
  hasPassword: z.boolean(),
});
export type ConnectedAccountsResponse = z.infer<
  typeof ConnectedAccountsResponseSchema
>;
