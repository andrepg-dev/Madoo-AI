const PENDING_PROMPT_KEY = "madoo.pendingPrompt";

export type StoredPrompt = {
  prompt: string;
  tone?: string;
  length?: string;
  audience?: string;
};

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
