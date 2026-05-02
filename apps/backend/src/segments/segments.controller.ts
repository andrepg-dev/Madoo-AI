import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { SegmentFromPromptDto } from "./dto/segment-from-prompt.dto";
import { SegmentsService } from "./segments.service";

@Controller({ path: "segments", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: CreateSegmentDto,
  ) {
    return this.segments.create(workspace.id, user.sub, body);
  }

  @Get()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
  ) {
    return this.segments.list(workspace.id, user.sub);
  }

  @Post("from-prompt")
  fromPrompt(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: SegmentFromPromptDto,
  ) {
    return this.segments.previewFromPrompt(workspace.id, user.sub, body.prompt);
  }

  @Get(":id")
  getOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.segments.getById(workspace.id, user.sub, id);
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.segments.remove(workspace.id, user.sub, id);
    return { ok: true };
  }

  @Post(":id/preview")
  preview(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.segments.preview(workspace.id, user.sub, id);
  }
}
