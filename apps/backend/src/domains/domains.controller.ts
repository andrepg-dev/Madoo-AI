import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { DomainsService } from "./domains.service";
import { CreateDomainDto } from "./dto/create-domain.dto";

@Controller({ path: "domains", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DomainsController {
  constructor(private readonly domains: DomainsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: CreateDomainDto,
  ) {
    return this.domains.create(workspace.id, user.sub, body);
  }

  @Get()
  list(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: { sub: string }) {
    return this.domains.list(workspace.id, user.sub);
  }

  @Get(":id")
  getOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.domains.getById(workspace.id, user.sub, id);
  }

  @Post(":id/recheck")
  recheck(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.domains.triggerRecheck(workspace.id, user.sub, id);
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.domains.remove(workspace.id, user.sub, id);
    return { ok: true };
  }
}
