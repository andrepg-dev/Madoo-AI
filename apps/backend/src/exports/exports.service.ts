import { Injectable, NotFoundException } from "@nestjs/common";
import juice from "juice";
import {
  parseVariableSchemaJson,
  type EspProvider,
  type ExportImageFormat,
  type ExportPayloadDto,
  type VariableSpec,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ReactToHtmlService } from "../generation/react-to-html.service";
import { ScreenshotService } from "../generation/screenshot.service";
import { ESP_MERGE_TAGS } from "./esp-merge-tags";

export type ResolvedVariant = {
  emailId: string;
  variantId: string;
  subject: string;
  componentCode: string;
  compiledHtml: string;
  variables: VariableSpec[];
};

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reactToHtml: ReactToHtmlService,
    private readonly screenshot: ScreenshotService,
  ) {}

  /**
   * Resolve a specific variant (by id) or the latest variant of an email,
   * scoped to the caller's workspace. Throws if the email or variant is not
   * found inside the workspace.
   */
  async resolveVariant(
    emailId: string,
    workspaceId: string,
    variantId?: string,
  ): Promise<ResolvedVariant> {
    const variant = await this.prisma.emailVariant.findFirst({
      where: {
        emailId,
        workspaceId,
        ...(variantId ? { id: variantId } : {}),
      },
      orderBy: { seq: "desc" },
    });
    if (!variant) {
      throw new NotFoundException("Email variant not found for this workspace.");
    }
    return {
      emailId,
      variantId: variant.id,
      subject: variant.subject,
      componentCode: variant.componentCode,
      compiledHtml: variant.compiledHtml,
      variables: parseVariableSchemaJson(variant.variableSchema).variables,
    };
  }

  /** Inline all CSS into element style attributes for ESP/client compatibility. */
  inlineCss(html: string): string {
    try {
      return juice(html);
    } catch {
      return html;
    }
  }

  async exportHtml(
    emailId: string,
    workspaceId: string,
    variantId?: string,
  ): Promise<{ filename: string; html: string }> {
    const variant = await this.resolveVariant(emailId, workspaceId, variantId);
    return {
      filename: `${slugify(variant.subject)}.html`,
      html: this.inlineCss(variant.compiledHtml),
    };
  }

  async exportImage(
    emailId: string,
    workspaceId: string,
    format: ExportImageFormat,
    variantId?: string,
  ): Promise<{ filename: string; buffer: Buffer; contentType: string }> {
    const variant = await this.resolveVariant(emailId, workspaceId, variantId);
    const buffer = await this.screenshot.screenshotHtml(variant.compiledHtml, {
      type: format,
      quality: format === "jpeg" ? 92 : undefined,
    });
    return {
      filename: `${slugify(variant.subject)}.${format === "jpeg" ? "jpg" : "png"}`,
      buffer,
      contentType: format === "jpeg" ? "image/jpeg" : "image/png",
    };
  }

  async exportPdf(
    emailId: string,
    workspaceId: string,
    variantId?: string,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const variant = await this.resolveVariant(emailId, workspaceId, variantId);
    const buffer = await this.screenshot.pdfFromHtml(variant.compiledHtml);
    return { filename: `${slugify(variant.subject)}.pdf`, buffer };
  }

  /**
   * Re-render the email component with ESP merge tags substituted for dynamic
   * variables (static variables keep their defaults), then inline CSS.
   */
  async exportEsp(
    emailId: string,
    workspaceId: string,
    provider: EspProvider,
    variantId?: string,
  ): Promise<{ filename: string; html: string }> {
    const variant = await this.resolveVariant(emailId, workspaceId, variantId);
    const formatter = ESP_MERGE_TAGS[provider];
    const props: Record<string, string> = {};
    for (const v of variant.variables) {
      props[v.name] = v.scope === "static" ? v.default : formatter(v.name);
    }
    const Component = this.reactToHtml.compileComponent(variant.componentCode);
    const rendered = this.reactToHtml.renderComponent(Component, props);
    return {
      filename: `${slugify(variant.subject)}-${provider}.html`,
      html: this.inlineCss(rendered),
    };
  }

  async exportPayload(
    emailId: string,
    workspaceId: string,
    variantId?: string,
  ): Promise<ExportPayloadDto> {
    const variant = await this.resolveVariant(emailId, workspaceId, variantId);
    return {
      emailId,
      subject: variant.subject,
      html: this.inlineCss(variant.compiledHtml),
      variables: variant.variables.map((v) => ({
        name: v.name,
        label: v.label,
        default: v.default,
        role: v.role,
        scope: v.scope,
      })),
    };
  }
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "email";
}
