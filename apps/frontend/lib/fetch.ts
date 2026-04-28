import { WORKSPACE_HEADER } from "@madoo/shared";
import { API_URL } from "./env";
import { clearToken, getToken, getWorkspaceId } from "./storage";

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
  const headers: Headers = { ...(options.headers as Headers | undefined) };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const method = (options.method ?? "GET").toUpperCase();
  if (!isFormData && (method === "POST" || method === "PATCH" || method === "PUT")) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const workspaceId = getWorkspaceId();
  if (workspaceId && !headers[WORKSPACE_HEADER]) {
    headers[WORKSPACE_HEADER] = workspaceId;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorResponse = await res.json().catch(() => null);
    const raw = (errorResponse as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${res.status})`;

    if (res.status === 401 && typeof window !== "undefined") {
      clearToken();
    }

    throw new ApiError(res.status, message, errorResponse);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
