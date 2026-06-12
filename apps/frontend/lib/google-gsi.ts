declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: GsiInitConfig) => void;
          prompt: (callback?: (notif: GsiPromptNotification) => void) => void;
          renderButton: (parent: HTMLElement, opts: GsiButtonOptions) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export type GsiCredentialResponse = {
  credential: string;
  select_by?: string;
};

export type GsiInitConfig = {
  client_id: string;
  callback: (resp: GsiCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: "popup" | "redirect";
  use_fedcm_for_prompt?: boolean;
};

export type GsiPromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
};

export type GsiButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let loadPromise: Promise<void> | null = null;

export function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("not in browser"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GSI script failed to load")), {
        once: true,
      });
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GSI script failed to load"));
    document.head.appendChild(s);
  });
  return loadPromise;
}
