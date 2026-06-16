import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import {
  CreateDraftResponseSchema,
  EspProviderSchema,
  ExportImageFormatSchema,
  type CreateDraftResponse,
  type ExportPayloadDto,
} from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import {
  WorkspaceGuard,
  type WorkspaceScopedRequest,
} from "../workspaces/workspace.guard";
import { ExportsService } from "./exports.service";
import { ConnectionsService } from "../connections/connections.service";

@Controller({ path: "emails", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ExportsController {
  constructor(
    private readonly exports: ExportsService,
    private readonly connections: ConnectionsService,
  ) {}

  @Get(":id/export/html")
  async html(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Query("variantId") variantId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, html } = await this.exports.exportHtml(
      id,
      req.workspace.id,
      variantId || undefined,
    );
    sendAttachment(res, filename, "text/html; charset=utf-8", Buffer.from(html, "utf8"));
  }

  @Get(":id/export/image")
  async image(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Query("variantId") variantId: string | undefined,
    @Query("format") format: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const parsed = ExportImageFormatSchema.parse((format ?? "png").toLowerCase());
    const { filename, buffer, contentType } = await this.exports.exportImage(
      id,
      req.workspace.id,
      parsed,
      variantId || undefined,
    );
    sendAttachment(res, filename, contentType, buffer);
  }

  @Get(":id/export/pdf")
  async pdf(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Query("variantId") variantId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, buffer } = await this.exports.exportPdf(
      id,
      req.workspace.id,
      variantId || undefined,
    );
    sendAttachment(res, filename, "application/pdf", buffer);
  }

  @Get(":id/export/esp")
  async esp(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Query("provider") provider: string | undefined,
    @Query("variantId") variantId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const parsed = EspProviderSchema.parse((provider ?? "").toLowerCase());
    const { filename, html } = await this.exports.exportEsp(
      id,
      req.workspace.id,
      parsed,
      variantId || undefined,
    );
    sendAttachment(res, filename, "text/html; charset=utf-8", Buffer.from(html, "utf8"));
  }

  @Get(":id/export/payload")
  async payload(
    @Req() req: WorkspaceScopedRequest,
    @Param("id") id: string,
    @Query("variantId") variantId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const data: ExportPayloadDto = await this.exports.exportPayload(
      id,
      req.workspace.id,
      variantId || undefined,
    );
    const json = JSON.stringify(data, null, 2);
    sendAttachment(
      res,
      `email-payload.json`,
      "application/json; charset=utf-8",
      Buffer.from(json, "utf8"),
    );
  }

  @Post(":id/export/gmail-draft")
  async gmailDraft(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: { variantId?: string } | undefined,
  ): Promise<CreateDraftResponse> {
    const variant = await this.exports.resolveVariant(
      id,
      req.workspace.id,
      body?.variantId,
    );
    const result = await this.connections.createGmailDraft(user.sub, {
      subject: variant.subject,
      html: this.exports.inlineCss(variant.compiledHtml),
    });
    return CreateDraftResponseSchema.parse(result);
  }

  @Post(":id/export/outlook-draft")
  async outlookDraft(
    @Req() req: WorkspaceScopedRequest,
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: { variantId?: string } | undefined,
  ): Promise<CreateDraftResponse> {
    const variant = await this.exports.resolveVariant(
      id,
      req.workspace.id,
      body?.variantId,
    );
    const result = await this.connections.createOutlookDraft(user.sub, {
      subject: variant.subject,
      html: this.exports.inlineCss(variant.compiledHtml),
    });
    return CreateDraftResponseSchema.parse(result);
  }
}

function sendAttachment(
  res: Response,
  filename: string,
  contentType: string,
  buffer: Buffer,
): void {
  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename.replace(/"/g, "")}"`,
  );
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.end(buffer);
}
