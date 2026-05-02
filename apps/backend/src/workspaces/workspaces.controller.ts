import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { toMyWorkspaceDto, type MyWorkspaceDto } from "./dto/workspace.dto";

@Controller({ path: "workspaces", version: "1" })
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get("me")
  async listMine(@CurrentUser() current: { sub: string }): Promise<MyWorkspaceDto[]> {
    const rows = await this.workspaces.listForUser(current.sub);
    return rows.map((row) => toMyWorkspaceDto(row, row.membership));
  }

  @Post()
  async create(
    @CurrentUser() current: { sub: string },
    @Body() body: CreateWorkspaceDto,
  ): Promise<MyWorkspaceDto> {
    const workspace = await this.workspaces.createForUser(current.sub, body.name);
    return toMyWorkspaceDto(workspace, { role: "OWNER" });
  }
}
