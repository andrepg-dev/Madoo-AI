import { Controller, Get, Version } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis from "ioredis";
import { PrismaService } from "./prisma/prisma.service";

type Check = { ok: boolean; latencyMs?: number; error?: string; skipped?: boolean };
type HealthReport = {
  status: "ok" | "degraded";
  uptime: number;
  checks: {
    db: Check;
    redis: Check;
    anthropic: Check;
    resend: Check;
    stripe: Check;
  };
};

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Version("1")
  async health(): Promise<HealthReport> {
    const [db, redis] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
    ]);
    const anthropic = this.checkConfig("ANTHROPIC_API_KEY");
    const resend = this.checkConfig("RESEND_API_KEY");
    const stripe = this.checkConfig("STRIPE_SECRET_KEY");

    const allOk = [db, redis].every((c) => c.ok);
    return {
      status: allOk ? "ok" : "degraded",
      uptime: process.uptime(),
      checks: { db, redis, anthropic, resend, stripe },
    };
  }

  private async checkDb(): Promise<Check> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "db ping failed",
      };
    }
  }

  private async checkRedis(): Promise<Check> {
    const url = this.config.get<string>("REDIS_URL");
    if (!url) return { ok: false, skipped: true, error: "REDIS_URL unset" };
    const start = Date.now();
    let client: IORedis | null = null;
    try {
      client = new IORedis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      await client.connect();
      await client.ping();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "redis ping failed",
      };
    } finally {
      try {
        client?.disconnect();
      } catch {
        // ignore cleanup errors
      }
    }
  }

  private checkConfig(name: string): Check {
    const value = this.config.get<string>(name);
    if (!value) return { ok: false, skipped: true, error: `${name} unset` };
    return { ok: true };
  }
}
