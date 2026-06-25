import { cookies } from "next/headers";
import { ADMIN_TOKEN_COOKIE, API_URL } from "./env";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * Server-side fetch to the Madoo backend, authenticated with the admin's token
 * stored in this app's own httpOnly cookie. Throws {@link AdminApiError} on a
 * non-2xx response so callers can branch on 401/403.
 */
export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const method = (options.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH"].includes(method)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const raw = data?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${res.status})`;
    throw new AdminApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
