import {
  Body,
  Controller,
  Post,
  Req,
  Sse,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { Observable } from "rxjs";
import {
  PublicGenerateSchema,
  type PublicGenerateResult,
} from "@madoo/shared";
import { PublicGenerateService } from "./public-generate.service";
import { ServiceTokenGuard } from "./service-token.guard";

/**
 * Anonymous, service-token-guarded email generation for the MCP acquisition
 * tool. No user session. Rate-limited per IP + global daily cap.
 */
@Controller({ path: "public/generate", version: "1" })
@UseGuards(ServiceTokenGuard)
export class PublicGenerateController {
  constructor(private readonly service: PublicGenerateService) {}

  @Post()
  generate(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<PublicGenerateResult> {
    const dto = PublicGenerateSchema.parse(body ?? {});
    return this.service.generate(dto, clientIp(req));
  }

  /**
   * Same generation, streamed. Progress payloads first, then a terminal
   * `result` / `gate` / `error` event — the MCP server relays these to the chat
   * client as progress notifications so the user sees what is happening.
   */
  @Post("stream")
  @Sse()
  generateStream(
    @Req() req: Request,
    @Body() body: unknown,
  ): Observable<MessageEvent> {
    const dto = PublicGenerateSchema.parse(body ?? {});
    return this.service.generateStream(dto, clientIp(req));
  }
}

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}
