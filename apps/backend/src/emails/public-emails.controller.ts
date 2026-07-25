import { Controller, Get, Header, Param } from "@nestjs/common";
import type { PublicEmailDto } from "@madoo/shared";
import { EmailsService } from "./emails.service";

/**
 * Unauthenticated read-only access to PUBLIC share links. Deliberately has no
 * JwtAuthGuard/WorkspaceGuard: anyone with the `publicId` can view the rendered
 * email, and nothing else is exposed (see EmailsService.getPublicByPublicId).
 */
@Controller({ path: "public/emails", version: "1" })
export class PublicEmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Get(":publicId")
  getOne(@Param("publicId") publicId: string): Promise<PublicEmailDto> {
    return this.emails.getPublicByPublicId(publicId);
  }

  /**
   * Renders the shared email as a standalone HTML page. Used as the human-facing
   * preview link handed out by the MCP acquisition tool — self-contained, so it
   * works regardless of frontend deployment state.
   */
  @Get(":publicId/view")
  @Header("Content-Type", "text/html; charset=utf-8")
  view(@Param("publicId") publicId: string): Promise<string> {
    return this.emails.getPublicHtml(publicId);
  }
}
