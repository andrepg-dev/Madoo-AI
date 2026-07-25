import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * In-memory daily rate limiter for anonymous generation. Bounds LLM spend by
 * (a) per-IP daily count and (b) a global daily cap. Counters reset at 00:00 UTC.
 *
 * NOTE: single-process only (the backend runs one container). If the API is
 * ever horizontally scaled, move these counters to Redis (REDIS_URL is already
 * provisioned) so limits hold across instances.
 */
@Injectable()
export class AnonRateLimiter {
  private day = currentUtcDay();
  private perIp = new Map<string, number>();
  private globalCount = 0;

  private readonly perIpLimit: number;
  private readonly globalLimit: number;

  constructor(config: ConfigService) {
    this.perIpLimit = Number(config.get("ANON_PER_IP_DAILY") ?? 3);
    this.globalLimit = Number(config.get("ANON_GLOBAL_DAILY") ?? 200);
  }

  private rollIfNewDay(): void {
    const today = currentUtcDay();
    if (today !== this.day) {
      this.day = today;
      this.perIp.clear();
      this.globalCount = 0;
    }
  }

  /** Reserve one generation slot for `ip`, or return why it was refused. */
  tryConsume(ip: string): { ok: true } | { ok: false; reason: string } {
    this.rollIfNewDay();
    if (this.globalCount >= this.globalLimit) {
      return { ok: false, reason: "Daily free generation capacity reached. Try again tomorrow." };
    }
    const used = this.perIp.get(ip) ?? 0;
    if (used >= this.perIpLimit) {
      return {
        ok: false,
        reason: `Free limit reached: ${this.perIpLimit} generations per day. Sign up at Madoo for more.`,
      };
    }
    this.perIp.set(ip, used + 1);
    this.globalCount += 1;
    return { ok: true };
  }

  /** Refund a slot when generation fails, so users aren't charged for errors. */
  refund(ip: string): void {
    const used = this.perIp.get(ip) ?? 0;
    if (used > 0) this.perIp.set(ip, used - 1);
    if (this.globalCount > 0) this.globalCount -= 1;
  }
}

function currentUtcDay(): string {
  return new Date().toISOString().slice(0, 10);
}
