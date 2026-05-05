import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

export function verifyResendSignature(args: {
  rawBody: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  secret: string;
}): boolean {
  const { rawBody, svixId, svixTimestamp, svixSignature, secret } = args;
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TOLERANCE_SECONDS) return false;

  const cleanedSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(cleanedSecret, "base64");
  } catch {
    return false;
  }
  if (key.length === 0) key = Buffer.from(cleanedSecret, "utf8");

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedPayload).digest("base64");

  const presented = svixSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const candidate of presented) {
    const [, value] = candidate.split(",");
    if (!value) continue;
    const valueBuf = Buffer.from(value);
    const expectedBuf = Buffer.from(expected);
    if (valueBuf.length !== expectedBuf.length) continue;
    if (timingSafeEqual(valueBuf, expectedBuf)) return true;
  }
  return false;
}
