"use server";

import { AuthSessionResponseSchema } from "@madoo/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_TOKEN_COOKIE, API_URL } from "@/lib/env";

export type LoginResult = { error: string } | undefined;

/**
 * Exchanges a Google ID token (from Google Identity Services in the browser)
 * for a backend session, then stores the returned token in this app's own
 * httpOnly cookie and redirects to the dashboard. Google is the only sign-in
 * method — admin authorization itself is enforced by the backend's AdminGuard
 * (ADMIN_EMAILS), so a non-admin can sign in but every admin endpoint 403s.
 */
export async function loginWithGoogleAction(
  idToken: string,
): Promise<LoginResult> {
  if (!idToken) {
    return { error: "Missing Google credential. Try again." };
  }

  let token: string;
  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { error: "Google sign-in failed. Try again." };
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
