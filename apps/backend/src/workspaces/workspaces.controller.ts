import { Controller, Get, UseGuards } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
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
}
