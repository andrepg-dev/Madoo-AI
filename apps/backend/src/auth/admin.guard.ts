import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthedRequest } from "./jwt-auth.guard";

/**
 * Gates admin-only endpoints behind a comma-separated `ADMIN_EMAILS` allowlist.
 * Must run AFTER {@link JwtAuthGuard} so `req.user` is populated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const email = req.user?.email?.toLowerCase();
    if (!email || !this.adminEmails().includes(email)) {
      throw new ForbiddenException("Admin access required.");
    }
    return true;
  }

  private adminEmails(): string[] {
    return (this.config.get<string>("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }
}
