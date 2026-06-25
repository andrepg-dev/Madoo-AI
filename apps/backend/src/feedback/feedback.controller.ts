import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FeedbackListSchema, WORKSPACE_HEADER } from "@madoo/shared";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { getWorkspaceHeader } from "../support/support.service";
import { toFeedbackDto, type FeedbackDto } from "./dto/feedback.dto";
import { FeedbackService } from "./feedback.service";

@Controller({ path: "feedback", version: "1" })
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  async create(
    @CurrentUser() current: { sub: string; email: string },
    @Headers(WORKSPACE_HEADER) rawWorkspaceHeader: string | string[] | undefined,
    @Body() body: unknown,
  ): Promise<FeedbackDto> {
    const created = await this.feedback.create({
      userId: current.sub,
      userEmail: current.email,
      workspaceHeader: getWorkspaceHeader(rawWorkspaceHeader),
      body,
    });
    return toFeedbackDto(created);
  }

  @Get()
  @UseGuards(AdminGuard)
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const size = clampInt(pageSize, 50, 1, 200);
    const pageNum = clampInt(page, 1, 1, Number.MAX_SAFE_INTEGER);
    const { items, total } = await this.feedback.list({
      take: size,
      skip: (pageNum - 1) * size,
    });
    return FeedbackListSchema.parse({
      items: items.map(toFeedbackDto),
      total,
    });
  }
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
