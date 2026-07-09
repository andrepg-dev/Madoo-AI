import { Controller, Get, Param } from "@nestjs/common";
import { CommunityTemplatesService } from "./community-templates.service";

@Controller({ path: "public/community-templates", version: "1" })
export class PublicCommunityTemplatesController {
  constructor(private readonly communityTemplates: CommunityTemplatesService) {}

  @Get()
  list() {
    return this.communityTemplates.listPublic();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.communityTemplates.getPublic(id);
  }
}
