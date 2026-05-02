import { Injectable, NotFoundException } from "@nestjs/common";
import { SegmentQuerySchema } from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { toContactDto, type ContactDto } from "../contacts/dto/contact.dto";
import type { CreateSegmentDto } from "./dto/create-segment.dto";
import {
  toSegmentDto,
  type SegmentDto,
  type SegmentPreviewDto,
  type ParsedSegmentQuery,
} from "./dto/segment.dto";
import { buildPrismaWhere } from "./segment-query";

@Injectable()
export class SegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateSegmentDto): Promise<SegmentDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const parsedQuery = SegmentQuerySchema.parse(dto.query);
    const row = await this.prisma.segment.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        query: parsedQuery,
      },
    });
    return toSegmentDto(row);
  }

  async list(workspaceId: string, userId: string): Promise<SegmentDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.segment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toSegmentDto(row));
  }

  async getById(workspaceId: string, userId: string, segmentId: string): Promise<SegmentDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
    });
    if (!row) throw new NotFoundException("Segment not found.");
    return toSegmentDto(row);
  }

  async remove(workspaceId: string, userId: string, segmentId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const found = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Segment not found.");
    await this.prisma.segment.delete({ where: { id: segmentId } });
  }

  async preview(
    workspaceId: string,
    userId: string,
    segmentId: string,
  ): Promise<SegmentPreviewDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
      select: { query: true },
    });
    if (!row) throw new NotFoundException("Segment not found.");

    const query = SegmentQuerySchema.parse(row.query) as ParsedSegmentQuery;
    const where = buildPrismaWhere(workspaceId, query);
    const [count, sample] = await this.prisma.$transaction([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      count,
      sampleContacts: sample.map((contact) => toContactDto(contact)),
    };
  }

  async previewFromPrompt(
    workspaceId: string,
    userId: string,
    prompt: string,
  ): Promise<{ name: string; query: ParsedSegmentQuery; count: number; sampleContacts: ContactDto[] }> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const query = await this.inferQueryFromPrompt(workspaceId, prompt);
    const where = buildPrismaWhere(workspaceId, query);
    const [count, sample] = await this.prisma.$transaction([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    return {
      name: this.inferSegmentName(prompt),
      query,
      count,
      sampleContacts: sample.map((contact) => toContactDto(contact)),
    };
  }

  private inferSegmentName(prompt: string): string {
    const cleaned = prompt.trim().replace(/\s+/g, " ");
    if (!cleaned) return "New segment";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private async inferQueryFromPrompt(
    workspaceId: string,
    prompt: string,
  ): Promise<ParsedSegmentQuery> {
    const lower = prompt.toLowerCase();
    const query: ParsedSegmentQuery = {};

    if (lower.includes("unsubscribed")) query.status = "unsubscribed";
    else if (lower.includes("bounced")) query.status = "bounced";
    else if (lower.includes("complained")) query.status = "complained";
    else if (lower.includes("active")) query.status = "active";

    const daysMatch = lower.match(/last\s+(\d+)\s+days?/);
    if (daysMatch) {
      const days = Number(daysMatch[1]);
      if (Number.isFinite(days) && days > 0) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.createdAfter = date.toISOString();
      }
    }

    const tags = await this.prisma.tag.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    const matchedTagIds = tags
      .filter((tag) => lower.includes(tag.name.toLowerCase()))
      .map((tag) => tag.id);
    if (matchedTagIds.length > 0) query.tags = matchedTagIds;

    return SegmentQuerySchema.parse(query);
  }
}
