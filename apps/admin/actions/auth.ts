"use server";

import {
  AuthSessionResponseSchema,
  PasswordLoginInputSchema,
} from "@madoo/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_TOKEN_COOKIE, API_URL } from "@/lib/env";

export type LoginState = { error: string | null };

/**
 * Logs in against the backend with email + password, stores the returned token
 * in this app's own httpOnly cookie, then redirects to the dashboard. Admin
 * authorization itself is enforced by the backend's AdminGuard — a non-admin
 * can log in but every admin endpoint returns 403.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = PasswordLoginInputSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  let token: string;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    if (!res.ok) {
      return { error: "Invalid email or password." };
    }
    const session = AuthSessionResponseSchema.parse(await res.json());
    token = session.token;
  } catch {
    return { error: "Could not reach the server. Try again." };
  }

  (await cookies()).set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_TOKEN_COOKIE);
  redirect("/login");
}
