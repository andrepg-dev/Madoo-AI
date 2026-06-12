"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { UserSchema, type UpdateUserMeInput, type User } from "@madoo/shared";
import { cookies } from "next/headers";

export type AuthUser = User;

export async function getMe(): Promise<AuthUser> {
  const raw = await FetchWrapper<AuthUser>("/auth/me");
  return UserSchema.parse(raw);
}

export async function getMeOrNull(): Promise<AuthUser | null> {
  try {
    return await getMe();
  } catch {
    return null;
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await FetchWrapper<void>("/auth/logout", { method: "POST" });
  } catch {
    // Backend cookie clearing is best-effort; first-party cookies below are authoritative.
  }
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  jar.delete(WORKSPACE_COOKIE);
}

export async function updateMe(input: UpdateUserMeInput): Promise<AuthUser> {
  const raw = await FetchWrapper<AuthUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return UserSchema.parse(raw);
}

export async function uploadAvatar(formData: FormData): Promise<AuthUser> {
  const raw = await FetchWrapper<AuthUser>("/users/me/avatar", {
    method: "POST",
    body: formData,
  });
  return UserSchema.parse(raw);
}
