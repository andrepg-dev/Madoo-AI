const TOKEN_KEY = "madoo.auth.token";
const PENDING_PROMPT_KEY = "madoo.pendingPrompt";
const WORKSPACE_KEY = "madoo.workspace.id";

export type StoredPrompt = {
  prompt: string;
  tone?: string;
  length?: string;
  audience?: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function savePendingPrompt(p: StoredPrompt) {
  window.localStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify(p));
}

export function readPendingPrompt(): StoredPrompt | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_PROMPT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPrompt;
  } catch {
    return null;
  }
}

export function clearPendingPrompt() {
  window.localStorage.removeItem(PENDING_PROMPT_KEY);
}

export function getWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WORKSPACE_KEY);
}

export function setWorkspaceId(id: string) {
  window.localStorage.setItem(WORKSPACE_KEY, id);
}

export function clearWorkspaceId() {
  window.localStorage.removeItem(WORKSPACE_KEY);
}
