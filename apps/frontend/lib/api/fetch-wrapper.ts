import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Headers = Record<string, string>;

export async function FetchWrapper<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const headers: Headers = { ...(options.headers as Headers | undefined) };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const method = (options.method ?? "GET").toUpperCase();

  if (
    !isFormData &&
    (method === "POST" || method === "PATCH" || method === "PUT")
  ) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (workspaceId && !headers[WORKSPACE_HEADER]) {
    headers[WORKSPACE_HEADER] = workspaceId;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorResponse = await res.json().catch(() => null);
    const raw = (errorResponse as { message?: string | string[] } | null)
      ?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, errorResponse);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
