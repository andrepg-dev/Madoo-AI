import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import type { CreateTagDto } from "./dto/create-tag.dto";
import { toTagDto, type TagDto } from "./dto/tag.dto";

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateTagDto): Promise<TagDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.tag.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        color: dto.color?.trim() || null,
      },
    });
    return toTagDto(row);
  }

  async list(workspaceId: string, userId: string): Promise<TagDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => toTagDto(row));
  }

  async remove(workspaceId: string, userId: string, tagId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const found = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Tag not found.");
    await this.prisma.tag.delete({ where: { id: tagId } });
  }
}
