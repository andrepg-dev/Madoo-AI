import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { CreateTagDto } from "./dto/create-tag.dto";
import { TagsService } from "./tags.service";

@Controller({ path: "tags", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: CreateTagDto,
  ) {
    return this.tags.create(workspace.id, user.sub, body);
  }

  @Get()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
  ) {
    return this.tags.list(workspace.id, user.sub);
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.tags.remove(workspace.id, user.sub, id);
    return { ok: true };
  }
}
