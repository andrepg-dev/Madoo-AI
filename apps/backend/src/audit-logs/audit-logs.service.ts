import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { toAuditLogDto, type AuditLogEntryDto } from "./dto/audit-log.dto";

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string): Promise<AuditLogEntryDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((row) => toAuditLogDto(row));
  }
}
