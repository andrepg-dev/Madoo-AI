import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Role } from "@prisma/client";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { WorkspacesService } from "./workspaces.service";
import type { AuthedRequest } from "../auth/jwt-auth.guard";

export type WorkspaceContext = { id: string; role: Role };

export type WorkspaceScopedRequest = AuthedRequest & { workspace: WorkspaceContext };

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspaces: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<WorkspaceScopedRequest>();
    if (!req.user?.sub) {
      throw new ForbiddenException("Unauthenticated.");
    }
    const raw = req.headers[WORKSPACE_HEADER];
    const workspaceId = Array.isArray(raw) ? raw[0] : raw;
    if (!workspaceId) {
      throw new BadRequestException(`Missing ${WORKSPACE_HEADER} header.`);
    }
    const membership = await this.workspaces.assertMembership(req.user.sub, workspaceId);
    req.workspace = { id: workspaceId, role: membership.role };
    return true;
  }
}
