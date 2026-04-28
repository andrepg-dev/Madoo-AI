"use server";

import { cookies } from "next/headers";
import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  WORKSPACE_COOKIE,
  WORKSPACE_COOKIE_OPTIONS,
} from "@/lib/cookies";
import {
  GoogleLoginInputSchema,
  GoogleLoginResponseSchema,
  UserSchema,
  type GoogleLoginInput,
  type GoogleLoginResponse,
  type MyWorkspace,
  type User,
} from "@madoo/shared";

export type AuthUser = User;
export type { GoogleLoginInput };

export interface LoginResult {
  user: AuthUser;
  workspaces: MyWorkspace[];
  defaultWorkspaceId: string;
}

export async function loginWithGoogle(
  input: GoogleLoginInput,
): Promise<LoginResult> {
  const body = GoogleLoginInputSchema.parse(input);
  const raw = await FetchWrapper<GoogleLoginResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const result: GoogleLoginResponse = GoogleLoginResponseSchema.parse(raw);
  const jar = await cookies();
  jar.set(AUTH_COOKIE, result.token, AUTH_COOKIE_OPTIONS);
  jar.set(
    WORKSPACE_COOKIE,
    result.defaultWorkspaceId,
    WORKSPACE_COOKIE_OPTIONS,
  );

  return {
    user: result.user,
    workspaces: result.workspaces,
    defaultWorkspaceId: result.defaultWorkspaceId,
  };
}

export async function getMe(): Promise<AuthUser> {
  const raw = await FetchWrapper<AuthUser>("/auth/me");
  return UserSchema.parse(raw);
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  jar.delete(WORKSPACE_COOKIE);
}
