import {
  GoogleLoginInputSchema,
  GoogleLoginResponseSchema,
  UserSchema,
  type GoogleLoginInput,
  type GoogleLoginResponse,
  type User,
} from "@madoo/shared";
import { FetchWrapper } from "@/lib/fetch";

export type AuthUser = User;
export type { GoogleLoginInput, GoogleLoginResponse };

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export async function loginWithGoogle(
  input: GoogleLoginInput,
): Promise<GoogleLoginResponse> {
  const body = GoogleLoginInputSchema.parse(input);
  const raw = await FetchWrapper<unknown>("/auth/google", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return GoogleLoginResponseSchema.parse(raw);
}

export async function getMe(): Promise<AuthUser> {
  const raw = await FetchWrapper<unknown>("/auth/me");
  return UserSchema.parse(raw);
}
