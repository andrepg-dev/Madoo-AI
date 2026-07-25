import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * Guards the anonymous generate surface. The MCP server presents a shared
 * secret in `x-madoo-service-token`; there is no user session. Compared in
 * constant time to avoid leaking the token via timing.
 */
@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("MADOO_SERVICE_TOKEN") ?? "";
    if (!expected) {
      throw new UnauthorizedException("Service token not configured.");
    }
    const req = context.switchToHttp().getRequest<Request>();
    const provided =
      (req.headers["x-madoo-service-token"] as string | undefined) ?? "";

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException("Invalid service token.");
    }
    return true;
  }
}
