import { API_URL } from "@/lib/env";

type ApiHeaders = Record<string, string>;

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

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers: ApiHeaders = {
    ...(options.headers as ApiHeaders | undefined),
  };
  const method = (options.method ?? "GET").toUpperCase();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  let body: BodyInit | null | undefined;

  if (options.body == null) {
    body = options.body;
  } else if (isFormData || typeof options.body === "string") {
    body = options.body as BodyInit;
  } else {
    body = JSON.stringify(options.body);
  }

  if (!isFormData && ["POST", "PUT", "PATCH"].includes(method)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    body,
    headers,
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => null);
    const raw = (errorResponse as { message?: string | string[] } | null)
      ?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${response.status})`;

    throw new ApiError(response.status, message, errorResponse);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
