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
  const state = url.searchParams.get("state");

  if (error) {
    return html(popupScript(provider, false, error));
  }
  if (!code) {
    return html(popupScript(provider, false, "Missing authorization code."));
  }
  if (!state) {
    return html(popupScript(provider, false, "Missing OAuth state."));
  }

  const redirectUri = `${url.origin}/api/connections/${provider}/callback`;

  try {
    await FetchWrapper(`/connections/${provider}/exchange`, {
      method: "POST",
      body: JSON.stringify({ code, state, redirectUri }),
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

/** Escape for use as HTML text content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a JSON string for safe embedding inside a `<script>` block. Angle
 * brackets are neutralized so a `message` containing `</script>` cannot break
 * out of the tag.
 */
function escapeJsonForScript(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

function popupScript(provider: string, ok: boolean, message?: string): string {
  // `provider` and `message` are attacker-influenceable (OAuth error redirect),
  // so both sinks below are escaped: the script payload against `</script>`
  // breakout, and the visible text against HTML injection.
  const payload = escapeJsonForScript(
    JSON.stringify({
      type: "madoo:connection",
      provider,
      ok,
      message: message ?? null,
    }),
  );
  const visible = ok
    ? "Account connected. You can close this window."
    : `Connection failed: ${escapeHtml(message ?? "")}`;
  return `<!doctype html><html><body><script>
    (function () {
      try { window.opener && window.opener.postMessage(${payload}, window.location.origin); } catch (e) {}
      window.close();
    })();
  </script><p>${visible}</p></body></html>`;
}
