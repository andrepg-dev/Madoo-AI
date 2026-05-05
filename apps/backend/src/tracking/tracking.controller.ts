import { Controller, Get, Header, Param, Redirect, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { TrackingService } from "./tracking.service";
import { decodeClickToken, decodeOpenToken } from "./tracking-token";

@Controller({ path: "t", version: "1" })
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly config: ConfigService,
  ) {}

  @Get("o/:token.gif")
  @Header("Content-Type", "image/gif")
  @Header("Cache-Control", "no-store, max-age=0")
  @Header("Pragma", "no-cache")
  async open(@Param("token") token: string, @Res() res: Response): Promise<void> {
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    const payload = decodeOpenToken(token, secret);
    if (payload) {
      try {
        await this.tracking.recordOpen(payload.d);
      } catch {
        // swallow — pixel must always return
      }
    }
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.status(200).send(this.tracking.pixelBytes());
  }

  @Get("c/:token")
  @Redirect()
  async click(@Param("token") token: string): Promise<{ url: string; statusCode: number }> {
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    const fallback = this.config.get<string>("APP_URL") ?? "https://madooai.com";
    const payload = decodeClickToken(token, secret);
    if (!payload) return { url: fallback, statusCode: 302 };
    const resolved = await this.tracking.resolveClick(payload.d, payload.l);
    return { url: resolved?.url ?? fallback, statusCode: 302 };
  }
}
