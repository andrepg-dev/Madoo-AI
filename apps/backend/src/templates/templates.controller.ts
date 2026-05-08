import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { TemplateSlugSchema, type TemplateSlug } from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WorkspaceGuard, type WorkspaceScopedRequest } from "../workspaces/workspace.guard";
import { TemplatesService } from "./templates.service";

class SaveFromVariantDto {
  @IsString()
  variantId!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

@Controller({ path: "templates", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Req() req: WorkspaceScopedRequest) {
    return this.templates.listForWorkspace(req.workspace.id);
  }

  @Get("seed/:slug/preview")
  previewSeed(@Req() req: WorkspaceScopedRequest, @Param("slug") slug: string) {
    const parsed = TemplateSlugSchema.safeParse(slug);
    if (!parsed.success) throw new BadRequestException("Unknown template slug.");
    return this.templates.previewSeed(req.workspace.id, parsed.data as TemplateSlug);
  }

  @Post("from-variant")
  saveFromVariant(@Req() req: WorkspaceScopedRequest, @Body() body: SaveFromVariantDto) {
    return this.templates.saveFromVariant(req.workspace.id, body.variantId, body.name);
  }
}
