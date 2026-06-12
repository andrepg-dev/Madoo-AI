declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: AppleAuthConfig) => void;
        signIn: () => Promise<AppleAuthResponse>;
      };
    };
  }
}

type AppleAuthConfig = {
  clientId: string;
  scope: string;
  redirectURI: string;
  usePopup: boolean;
};

type AppleAuthResponse = {
  authorization?: {
    id_token?: string;
  };
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

const SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
let loadPromise: Promise<void> | null = null;

function loadAppleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("not in browser"));
  }

  if (window.AppleID?.auth) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Apple sign-in script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Apple sign-in script failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function appleSignIn(clientId: string): Promise<{
  idToken: string;
  name?: string;
}> {
  await loadAppleScript();

  if (!window.AppleID?.auth) {
    throw new Error("Apple sign-in is unavailable.");
  }

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: window.location.origin,
    usePopup: true,
  });

  const result = await window.AppleID.auth.signIn();
  const idToken = result.authorization?.id_token;
  if (!idToken) throw new Error("Apple sign-in did not return an id token.");

  const first = result.user?.name?.firstName?.trim();
  const last = result.user?.name?.lastName?.trim();
  const name = [first, last].filter(Boolean).join(" ") || undefined;

  return { idToken, name };
}
