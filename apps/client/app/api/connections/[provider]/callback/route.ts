import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { ConnectionProviderSchema } from "@madoo/shared";
import { NextRequest } from "next/server";

/**
 * OAuth redirect target for the connect popup. Exchanges the authorization
 * code (backend stores encrypted tokens), then posts the result back to the
 * opener window and closes itself.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const parsed = ConnectionProviderSchema.safeParse(rawProvider);
  if (!parsed.success) {
    return html(popupScript(rawProvider, false, "Unknown provider."));
  }
  const provider = parsed.data;

  const url = req.nextUrl;
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    return html(popupScript(provider, false, error));
  }
  if (!code) {
    return html(popupScript(provider, false, "Missing authorization code."));
  }

  const redirectUri = `${url.origin}/api/connections/${provider}/callback`;

  try {
    await FetchWrapper(`/connections/${provider}/exchange`, {
      method: "POST",
      body: JSON.stringify({ code, redirectUri }),
    });
    return html(popupScript(provider, true));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect account.";
    return html(popupScript(provider, false, message));
  }
}

function html(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function popupScript(provider: string, ok: boolean, message?: string): string {
  const payload = JSON.stringify({
    type: "madoo:connection",
    provider,
    ok,
    message: message ?? null,
  });
  return `<!doctype html><html><body><script>
    (function () {
      try { window.opener && window.opener.postMessage(${payload}, window.location.origin); } catch (e) {}
      window.close();
    })();
  </script><p>${ok ? "Account connected. You can close this window." : "Connection failed: " + (message ?? "")}</p></body></html>`;
}
