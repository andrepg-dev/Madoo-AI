import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminEmailsService } from "./admin-emails.service";

@Controller({ path: "admin/emails", version: "1" })
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEmailsController {
  constructor(private readonly emails: AdminEmailsService) {}

  @Get()
  list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
  ) {
    return this.emails.list({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.emails.detail(id);
  }
}
