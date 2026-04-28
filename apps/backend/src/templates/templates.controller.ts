import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WorkspaceGuard, type WorkspaceScopedRequest } from "../workspaces/workspace.guard";
import { TemplatesService } from "./templates.service";

@Controller({ path: "templates", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Req() req: WorkspaceScopedRequest) {
    return this.templates.listForWorkspace(req.workspace.id);
  }
}
