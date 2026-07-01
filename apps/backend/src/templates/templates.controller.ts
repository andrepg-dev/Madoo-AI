import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  SaveTemplateFromVariantSchema,
  TemplateSlugSchema,
  type TemplateSlug,
} from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  WorkspaceGuard,
  type WorkspaceScopedRequest,
} from "../workspaces/workspace.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { TemplatesService } from "./templates.service";

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
    return this.templates.previewSeed(
      req.workspace.id,
      parsed.data as TemplateSlug,
    );
  }

  @Post("from-variant")
  saveFromVariant(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    const dto = SaveTemplateFromVariantSchema.parse(body);
    return this.templates.saveFromVariant(
      req.workspace.id,
      user.sub,
      dto.variantId,
      dto.name,
    );
  }
}
