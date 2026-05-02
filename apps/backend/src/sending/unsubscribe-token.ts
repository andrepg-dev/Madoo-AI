import { createHmac, timingSafeEqual } from "node:crypto";

type UnsubscribePayload = {
  contactId: string;
  campaignId: string;
  deliveryId: string;
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

export function encodeUnsubscribeToken(payload: UnsubscribePayload, secret: string): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function decodeUnsubscribeToken(token: string, secret: string): UnsubscribePayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = sign(encodedPayload, secret);
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as UnsubscribePayload;
    if (!parsed.contactId || !parsed.campaignId || !parsed.deliveryId) return null;
    return parsed;
  } catch {
    return null;
  }
}
