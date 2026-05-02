import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ContactsService } from "./contacts.service";
import { WorkspaceGuard } from "../workspaces/workspace.guard";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import type { WorkspaceContext } from "../workspaces/workspace.guard";
import { AssignContactTagsDto } from "./dto/assign-contact-tags.dto";
import { ConfirmContactImportDto } from "./dto/confirm-contact-import.dto";
import { CreateContactDto } from "./dto/create-contact.dto";
import { ListContactsQueryDto } from "./dto/list-contacts-query.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Controller({ path: "contacts", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Body() body: CreateContactDto,
  ) {
    return this.contacts.create(workspace.id, user.sub, body);
  }

  @Get()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Query() query: ListContactsQueryDto,
  ) {
    return this.contacts.list(workspace.id, user.sub, query);
  }

  @Post("import")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadImport(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.contacts.uploadImportCsv(workspace.id, user.sub, file);
  }

  @Post("import/:jobId/confirm")
  confirmImport(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("jobId") jobId: string,
    @Body() body: ConfirmContactImportDto,
  ) {
    return this.contacts.confirmImportJob(workspace.id, user.sub, jobId, body);
  }

  @Get("import/:jobId")
  getImportJob(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("jobId") jobId: string,
  ) {
    return this.contacts.getImportJob(workspace.id, user.sub, jobId);
  }

  @Get(":id")
  getOne(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    return this.contacts.getById(workspace.id, user.sub, id);
  }

  @Patch(":id")
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: UpdateContactDto,
  ) {
    return this.contacts.update(workspace.id, user.sub, id, body);
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
  ) {
    await this.contacts.remove(workspace.id, user.sub, id);
    return { ok: true };
  }

  @Post(":id/tags")
  assignTags(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: AssignContactTagsDto,
  ) {
    return this.contacts.assignTags(workspace.id, user.sub, id, body);
  }
}
