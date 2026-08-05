import { Controller, Get, UseGuards } from "@nestjs/common";
import type { SkillDto } from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { listSkills } from "./skills.catalog";

/**
 * Catalog behind the composer's skill picker. Static content — no workspace
 * scoping needed, only a signed-in user.
 */
@Controller({ path: "skills", version: "1" })
@UseGuards(JwtAuthGuard)
export class SkillsController {
  @Get()
  list(): SkillDto[] {
    return listSkills();
  }
}
