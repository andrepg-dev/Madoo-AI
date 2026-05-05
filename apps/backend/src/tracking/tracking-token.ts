import { createHmac, timingSafeEqual } from "node:crypto";

export type OpenTokenPayload = {
  d: string;
};

export type ClickTokenPayload = {
  d: string;
  l: string;
};

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function encode(payload: object, secret: string): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function decode<T>(token: string, secret: string): T | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = sign(encodedPayload, secret);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as T;
  } catch {
    return null;
  }
}

export function encodeOpenToken(deliveryId: string, secret: string): string {
  return encode({ d: deliveryId }, secret);
}

export function decodeOpenToken(token: string, secret: string): OpenTokenPayload | null {
  const payload = decode<OpenTokenPayload>(token, secret);
  if (!payload || typeof payload.d !== "string" || !payload.d) return null;
  return payload;
}

export function encodeClickToken(
  deliveryId: string,
  trackedLinkId: string,
  secret: string,
): string {
  return encode({ d: deliveryId, l: trackedLinkId }, secret);
}

export function decodeClickToken(token: string, secret: string): ClickTokenPayload | null {
  const payload = decode<ClickTokenPayload>(token, secret);
  if (!payload || typeof payload.d !== "string" || typeof payload.l !== "string") return null;
  if (!payload.d || !payload.l) return null;
  return payload;
}
