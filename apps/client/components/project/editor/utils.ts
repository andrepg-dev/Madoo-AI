import type { ConnectionProvider } from "@madoo/shared";
import { maxPreviewWidthVw, minPreviewWidthVw } from "./constants";

export function formatCreditReset(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const ms = new Date(value).getTime() - Date.now();
    if (ms <= 0) return null;
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) {
      const mins = Math.floor(ms / 60_000);
      return `${mins}m left`;
    }
    return `${hours}h left`;
  } catch {
    return null;
  }
}

export function clampPreviewWidth(width: number) {
  return Math.min(maxPreviewWidthVw, Math.max(minPreviewWidthVw, width));
}

export function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

/** Trigger a browser download for an authenticated proxy URL. */
export function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Open the provider OAuth consent popup and resolve when it reports back. */
export function openConnectPopup(
  provider: ConnectionProvider,
  url: string,
): Promise<{ ok: boolean; message?: string | null }> {
  return new Promise((resolve) => {
    const popup = window.open(
      url,
      `madoo-connect-${provider}`,
      "width=520,height=680",
    );
    if (!popup) {
      resolve({ ok: false, message: "Popup blocked. Allow popups and retry." });
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        | { type?: string; provider?: string; ok?: boolean; message?: string | null }
        | undefined;
      if (data?.type !== "madoo:connection" || data.provider !== provider) return;
      cleanup();
      resolve({ ok: Boolean(data.ok), message: data.message });
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ ok: false, message: "Connection window closed." });
      }
    }, 500);
    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      try {
        popup?.close();
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("message", onMessage);
  });
}
