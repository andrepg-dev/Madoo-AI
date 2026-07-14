import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { PublicTemplateTestSendSchema } from "@madoo/shared";
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

  @Post(":id/test-send")
  @HttpCode(HttpStatus.OK)
  testSend(@Param("id") id: string, @Body() body: unknown) {
    const input = PublicTemplateTestSendSchema.parse(body ?? {});
    return this.communityTemplates.sendPublicTestEmail(id, input.to);
  }
}
