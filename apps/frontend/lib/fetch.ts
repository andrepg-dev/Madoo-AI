import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./env";
import { clearToken, getToken } from "./storage";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    const raw = data?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || error.message || `Request failed (${status})`;

    if (status === 401 && typeof window !== "undefined") {
      clearToken();
    }
    return Promise.reject(new ApiError(status, message));
  },
);

async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  const res = await p;
  return res.data;
}

export const fetcher = {
  get: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.get(url, config)),
  post: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    unwrap<T>(http.post(url, body, config)),
  put: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    unwrap<T>(http.put(url, body, config)),
  patch: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    unwrap<T>(http.patch(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.delete(url, config)),
};
