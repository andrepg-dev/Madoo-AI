import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Sse,
  UseGuards,
} from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import {
  WorkspaceGuard,
  type WorkspaceScopedRequest,
} from "../workspaces/workspace.guard";
import { EmailsService } from "./emails.service";
import { GenerationService } from "../generation/generation.service";
import {
  CreateEmailFromTemplateSchema,
  CreateEmailSchema,
  EditEmailSchema,
  RenameEmailSchema,
  TruncateEmailChatSchema,
  TransferEmailSchema,
  UpdateEmailShareSchema,
  UpdateEmailVariantVariableSchemaSchema,
} from "@madoo/shared";

@Controller({ path: "emails", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class EmailsController {
  constructor(
    private readonly emails: EmailsService,
    private readonly generation: GenerationService,
  ) {}

  @Post()
  async create(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    const dto = CreateEmailSchema.parse(body);
    return this.emails.create(req.workspace.id, user.sub, dto);
  }

  @Post("from-template")
  async createFromTemplate(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    const dto = CreateEmailFromTemplateSchema.parse(body);
    return this.emails.createFromTemplate(req.workspace.id, user.sub, dto);
  }

  @Get()
  list(@Req() req: WorkspaceScopedRequest, @CurrentUser() user: { sub: string }) {
    return this.emails.list(req.workspace.id, user.sub);
  }

  @Get(":id")
  getOne(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.emails.getById(id, req.workspace.id, user.sub);
  }

  @Get(":id/chat")
  listChat(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.emails.listChatMessages(id, req.workspace.id, user.sub);
  }

  @Post(":id/chat/truncate")
  truncateChat(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = TruncateEmailChatSchema.parse(body);
    return this.emails.truncateChatMessages(id, req.workspace.id, user.sub, dto);
  }

  @Delete(":id")
  async remove(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.emails.remove(id, req.workspace.id, user.sub);
    return { ok: true };
  }

  @Patch(":id")
  updateEmail(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = RenameEmailSchema.parse(body);
    return this.emails.rename(id, req.workspace.id, user.sub, dto);
  }

  @Patch(":id/share")
  setShare(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateEmailShareSchema.parse(body);
    return this.emails.setShare(id, req.workspace.id, user.sub, dto);
  }

  @Post(":id/transfer")
  transferEmail(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = TransferEmailSchema.parse(body);
    return this.emails.transfer(id, req.workspace.id, user.sub, dto);
  }

  @Post(":id/save")
  async saveTemplate(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.emails.saveTemplate(id, req.workspace.id, user.sub);
    return { ok: true };
  }

  @Patch(":id/variants/:variantId/variable-schema")
  updateVariantVariableSchema(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateEmailVariantVariableSchemaSchema.parse(body);
    return this.emails.updateVariantVariableSchema(
      id,
      variantId,
      req.workspace.id,
      user.sub,
      dto,
    );
  }

  @Post(":id/generate")
  @Sse()
  generate(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
  ): Observable<MessageEvent> {
    return this.generation.generateEmailStream(id, req.workspace.id);
  }

  @Post(":id/edit")
  @Sse()
  edit(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ): Observable<MessageEvent> {
    const dto = EditEmailSchema.parse(body);
    return this.generation.editEmailStream(id, req.workspace.id, dto);
  }
}
