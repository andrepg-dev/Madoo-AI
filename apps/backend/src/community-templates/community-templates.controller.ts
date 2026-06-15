import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  SetCommunityTemplateStarredSchema,
  ShareEmailToCommunitySchema,
  UseCommunityTemplateSchema,
} from "@madoo/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  WorkspaceGuard,
  type WorkspaceScopedRequest,
} from "../workspaces/workspace.guard";
import { CommunityTemplatesService } from "./community-templates.service";

@Controller({ path: "community-templates", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CommunityTemplatesController {
  constructor(private readonly communityTemplates: CommunityTemplatesService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.communityTemplates.list(user.sub);
  }

  @Get(":id")
  getOne(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.communityTemplates.get(id, user.sub);
  }

  @Post()
  share(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    const dto = ShareEmailToCommunitySchema.parse(body);
    return this.communityTemplates.share(req.workspace.id, user.sub, dto);
  }

  @Post(":id/use")
  use(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = UseCommunityTemplateSchema.parse(body);
    return this.communityTemplates.use(id, req.workspace.id, user.sub, dto);
  }

  @Patch(":id/star")
  setStarred(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = SetCommunityTemplateStarredSchema.parse(body);
    return this.communityTemplates.setStarred(id, user.sub, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  makePrivate(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.communityTemplates.makePrivate(id, user.sub);
  }
}
