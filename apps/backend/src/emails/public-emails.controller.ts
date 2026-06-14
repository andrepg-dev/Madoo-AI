import { Controller, Get, Param } from "@nestjs/common";
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
}
