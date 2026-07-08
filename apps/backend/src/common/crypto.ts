import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plainText: string, secret: string): string {
  if (!secret) {
    throw new Error("JWT_SECRET is required for encryption.");
  }
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(cipherText: string, secret: string): string {
  if (!secret) {
    throw new Error("Encryption secret is required for decryption.");
  }
  const parts = cipherText.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Malformed encrypted payload.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = deriveKey(secret);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Sign an arbitrary JSON payload into a compact `base64url(json).base64url(hmac)`
 * token (HMAC-SHA256). Used for stateless anti-CSRF `state` values; the payload
 * is not confidential, only tamper-evident.
 */
export function signPayload(payload: Record<string, unknown>, secret: string): string {
  if (!secret) {
    throw new Error("Signing secret is required.");
  }
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Verify a token produced by {@link signPayload}. Returns the decoded payload, or
 * `null` if the signature is missing/invalid/tampered. Uses a constant-time compare.
 */
export function verifyPayload<T = Record<string, unknown>>(
  token: string,
  secret: string,
): T | null {
  if (!secret || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
