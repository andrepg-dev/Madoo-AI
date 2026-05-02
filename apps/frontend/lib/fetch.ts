import { ApiError } from "@/lib/api/fetch-wrapper";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: BodyInit | Record<string, unknown>,
): Promise<TResponse> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormData) {
      payload = body as BodyInit;
    } else if (
      typeof body === "string" ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer
    ) {
      payload = body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: payload,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const raw = (errorData as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

export const fetcher = {
  get: <TResponse>(path: string) => request<TResponse>("GET", path),
  post: <TResponse, TBody = Record<string, unknown>>(path: string, body: TBody) =>
    request<TResponse>("POST", path, body as BodyInit | Record<string, unknown>),
  patch: <TResponse, TBody = Record<string, unknown>>(path: string, body: TBody) =>
    request<TResponse>("PATCH", path, body as BodyInit | Record<string, unknown>),
  delete: <TResponse>(path: string) => request<TResponse>("DELETE", path),
};
