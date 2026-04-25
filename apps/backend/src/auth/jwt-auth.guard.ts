import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

export type AuthedRequest = Request & { user: { sub: string; email: string } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token.");
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token, {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      req.user = { sub: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }
}
