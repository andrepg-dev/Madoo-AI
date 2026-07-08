import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * SSRF guard for server-side fetches of user/model-influenced URLs. Rejects
 * non-http(s) schemes, private/loopback/link-local hosts, and hostnames that
 * *resolve* to a private IP (DNS-rebinding defense). Callers should fetch with
 * `redirect: "manual"` and re-run {@link assertPublicUrl} on each hop.
 */

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

export function isPrivateIpAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  const kind = isIP(normalized);
  if (kind === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  if (kind === 6) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:") // IPv4-mapped; validate the embedded v4 separately
    );
  }
  return false;
}

function assertInspectableUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BlockedUrlError("URL is invalid.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new BlockedUrlError("URL must use http or https.");
  }
  const hostname = url.hostname.toLowerCase();
  const hostForIpCheck = hostname.replace(/^\[|\]$/g, "");
  if (
    PRIVATE_HOSTS.has(hostForIpCheck) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test")
  ) {
    throw new BlockedUrlError("Private or local URLs are not allowed.");
  }
  if (isIP(hostForIpCheck) && isPrivateIpAddress(hostForIpCheck)) {
    throw new BlockedUrlError("Private IP URLs are not allowed.");
  }
  return url;
}

/**
 * Validate a URL and confirm its hostname does not resolve to a private IP.
 * Throws {@link BlockedUrlError} on any violation; returns the parsed URL.
 */
export async function assertPublicUrl(input: string): Promise<URL> {
  const url = assertInspectableUrl(input);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(hostname)) return url; // already validated as public above
  try {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0 || addresses.some((e) => isPrivateIpAddress(e.address))) {
      throw new BlockedUrlError("URL resolves to a private IP.");
    }
  } catch (err) {
    if (err instanceof BlockedUrlError) throw err;
    throw new BlockedUrlError("Hostname could not be resolved.");
  }
  return url;
}
