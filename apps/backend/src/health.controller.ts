import { Controller, Get, Version } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma/prisma.service";

type Check = { ok: boolean; latencyMs?: number; error?: string; skipped?: boolean };
type HealthReport = {
  status: "ok" | "degraded";
  uptime: number;
  checks: {
    db: Check;
    anthropic: Check;
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
    const db = await this.checkDb();
    const anthropic = this.checkConfig("ANTHROPIC_API_KEY");
    const stripe = this.checkConfig("STRIPE_SECRET_KEY");

    return {
      status: db.ok ? "ok" : "degraded",
      uptime: process.uptime(),
      checks: { db, anthropic, stripe },
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

  private checkConfig(name: string): Check {
    const value = this.config.get<string>(name);
    if (!value) return { ok: false, skipped: true, error: `${name} unset` };
    return { ok: true };
  }
}
