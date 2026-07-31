import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AnonSession {
  /** Generations already completed in this MCP conversation. */
  used: number;
  /** publicId of the most recent generation, used to build the sign-in CTA. */
  lastPublicId?: string;
}

/**
 * Signed, stateless continuation token for anonymous MCP conversations.
 *
 * The MCP transport is stateless and remote connectors call us from the AI
 * provider's egress IPs, so IP is useless as a per-user key. Instead each
 * generation hands the model an opaque token that it passes back on the next
 * call; the token carries the free-generation counter. It is a soft gate, not
 * a security boundary — a caller that drops the token starts over, which is why
 * the per-IP and global daily caps stay in place.
 */
@Injectable()
export class AnonSessionService {
  private readonly secret: string;
  /** Free generations before the caller is asked to sign in. */
  readonly freeLimit: number;

  constructor(config: ConfigService) {
    this.secret =
      config.get<string>("MCP_SESSION_SECRET") ??
      config.get<string>("MADOO_SERVICE_TOKEN") ??
      config.get<string>("JWT_SECRET") ??
      "madoo-anon-session-dev-secret";
    this.freeLimit = Number(config.get("ANON_FREE_PER_SESSION") ?? 2);
  }

  /** Decode a token, or a fresh empty session when absent/invalid/expired. */
  read(token?: string): AnonSession {
    if (!token) return { used: 0 };
    const [body, sig] = token.split(".");
    if (!body || !sig) return { used: 0 };
    if (!this.verify(body, sig)) return { used: 0 };
    try {
      const payload = JSON.parse(
        Buffer.from(body, "base64url").toString("utf8"),
      ) as { used?: number; lastPublicId?: string; exp?: number };
      if (!payload.exp || payload.exp < Date.now()) return { used: 0 };
      return {
        used: Number.isFinite(payload.used) ? Number(payload.used) : 0,
        lastPublicId:
          typeof payload.lastPublicId === "string"
            ? payload.lastPublicId
            : undefined,
      };
    } catch {
      return { used: 0 };
    }
  }

  issue(session: AnonSession): string {
    const body = Buffer.from(
      JSON.stringify({ ...session, exp: Date.now() + TOKEN_TTL_MS }),
    ).toString("base64url");
    return `${body}.${this.sign(body)}`;
  }

  private sign(body: string): string {
    return createHmac("sha256", this.secret).update(body).digest("base64url");
  }

  private verify(body: string, sig: string): boolean {
    const expected = Buffer.from(this.sign(body));
    const given = Buffer.from(sig);
    if (expected.length !== given.length) return false;
    return timingSafeEqual(expected, given);
  }
}
