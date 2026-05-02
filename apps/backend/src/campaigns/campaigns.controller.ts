import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";

@Controller({ path: "campaigns", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: CreateCampaignDto,
  ) {
    return this.campaigns.create(workspace.id, user.sub, body);
  }

  @Get()
  list(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: { sub: string }) {
    return this.campaigns.list(workspace.id, user.sub);
  }

  @Get(":id/recipients")
  listRecipients(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.campaigns.listRecipients(workspace.id, user.sub, id);
  }

  @Get(":id")
  getOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.campaigns.getById(workspace.id, user.sub, id);
  }

  @Patch(":id")
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: UpdateCampaignDto,
  ) {
    return this.campaigns.update(workspace.id, user.sub, id, body);
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.campaigns.remove(workspace.id, user.sub, id);
    return { ok: true };
  }

  @Post(":id/test")
  testSend(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string; email: string },
    @Param("id") id: string,
  ) {
    return this.campaigns.sendTest(workspace.id, user.sub, id, user.email);
  }

  @Post(":id/send")
  send(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.campaigns.send(workspace.id, user.sub, id);
  }
}
