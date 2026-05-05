import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { SegmentQuerySchema, type ContactStatus } from "@madoo/shared";
import type { ContactStatus as PrismaContactStatus, Prisma } from "@prisma/client";
import type { Queue } from "bullmq";
import Papa from "papaparse";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { BillingService } from "../billing/billing.service";
import { buildPrismaWhere } from "../segments/segment-query";
import { toContactDto, type ContactDto } from "./dto/contact.dto";
import { toContactImportJobDto, type ContactImportJobDto } from "./dto/contact-import-job.dto";
import type { AssignContactTagsDto } from "./dto/assign-contact-tags.dto";
import {
  validateColumnMappingShape,
  type ConfirmContactImportDto,
} from "./dto/confirm-contact-import.dto";
import type { CreateContactDto } from "./dto/create-contact.dto";
import type { ListContactsQueryDto } from "./dto/list-contacts-query.dto";
import type { UpdateContactDto } from "./dto/update-contact.dto";
import { CONTACTS_IMPORT_JOB, CONTACTS_IMPORT_QUEUE } from "./contacts-import.types";

type PaginatedContactsDto = {
  items: ContactDto[];
  page: number;
  pageSize: number;
  total: number;
};

const CONTACT_WITH_TAGS_INCLUDE = {
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

function toPrismaStatus(status: ContactStatus): PrismaContactStatus {
  if (status === "unsubscribed") return "UNSUBSCRIBED";
  if (status === "bounced") return "BOUNCED";
  if (status === "complained") return "COMPLAINED";
  return "ACTIVE";
}

function parseCustomFields(input: unknown): Record<string, string> {
  if (input == null) return {};
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new BadRequestException("customFields must be an object of strings.");
  }

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new BadRequestException("customFields values must be strings.");
    }
    out[key] = value;
  }
  return out;
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly billing: BillingService,
    @InjectQueue(CONTACTS_IMPORT_QUEUE) private readonly importQueue: Queue,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateContactDto,
  ): Promise<ContactDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.billing.assertCanAddContacts(workspaceId, 1);
    const created = await this.prisma.contact.create({
      include: CONTACT_WITH_TAGS_INCLUDE,
      data: {
        workspaceId,
        email: dto.email.trim().toLowerCase(),
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        status: dto.status ? toPrismaStatus(dto.status) : "ACTIVE",
        customFields: parseCustomFields(dto.customFields),
      },
    });
    return toContactDto(created);
  }

  async list(
    workspaceId: string,
    userId: string,
    query: ListContactsQueryDto,
  ): Promise<PaginatedContactsDto> {
    await this.workspaces.assertMembership(userId, workspaceId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = await this.buildWhere(workspaceId, query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        include: CONTACT_WITH_TAGS_INCLUDE,
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items: rows.map((row) => toContactDto(row)),
      page,
      pageSize,
      total,
    };
  }

  async getById(workspaceId: string, userId: string, contactId: string): Promise<ContactDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.contact.findFirst({
      include: CONTACT_WITH_TAGS_INCLUDE,
      where: { id: contactId, workspaceId },
    });
    if (!row) throw new NotFoundException("Contact not found.");
    return toContactDto(row);
  }

  async update(
    workspaceId: string,
    userId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Promise<ContactDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertContactInWorkspace(workspaceId, contactId);

    const updated = await this.prisma.contact.update({
      include: CONTACT_WITH_TAGS_INCLUDE,
      where: { id: contactId },
      data: {
        email: dto.email ? dto.email.trim().toLowerCase() : undefined,
        firstName: dto.firstName !== undefined ? dto.firstName?.trim() || null : undefined,
        lastName: dto.lastName !== undefined ? dto.lastName?.trim() || null : undefined,
        status: dto.status ? toPrismaStatus(dto.status) : undefined,
        customFields:
          dto.customFields !== undefined ? parseCustomFields(dto.customFields) : undefined,
      },
    });

    return toContactDto(updated);
  }

  async remove(workspaceId: string, userId: string, contactId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertContactInWorkspace(workspaceId, contactId);
    await this.prisma.contact.delete({ where: { id: contactId } });
  }

  async assignTags(
    workspaceId: string,
    userId: string,
    contactId: string,
    dto: AssignContactTagsDto,
  ): Promise<ContactDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertContactInWorkspace(workspaceId, contactId);

    const uniqueTagIds = [...new Set(dto.tagIds)];
    if (uniqueTagIds.length > 0) {
      const tagsCount = await this.prisma.tag.count({
        where: { workspaceId, id: { in: uniqueTagIds } },
      });
      if (tagsCount !== uniqueTagIds.length) {
        throw new BadRequestException("One or more tags do not exist in this workspace.");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.contactTag.deleteMany({ where: { workspaceId, contactId } });
      if (uniqueTagIds.length > 0) {
        await tx.contactTag.createMany({
          data: uniqueTagIds.map((tagId) => ({ workspaceId, contactId, tagId })),
        });
      }
    });

    const row = await this.prisma.contact.findUnique({
      include: CONTACT_WITH_TAGS_INCLUDE,
      where: { id: contactId },
    });
    if (!row) throw new NotFoundException("Contact not found.");
    return toContactDto(row);
  }

  async uploadImportCsv(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{
    jobId: string;
    preview: Record<string, string>[];
    detectedColumns: string[];
  }> {
    await this.workspaces.assertMembership(userId, workspaceId);
    if (!file) throw new BadRequestException("CSV file is required.");
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("CSV file too large. Max size is 10MB.");
    }

    const raw = file.buffer.toString("utf8");
    const parsed = Papa.parse<Record<string, string>>(raw, {
      header: true,
      skipEmptyLines: true,
    });
    const detectedColumns = parsed.meta.fields ?? [];
    if (!detectedColumns.includes("email")) {
      throw new BadRequestException("CSV must include an email header.");
    }

    const jobId = this.makeImportJobId();
    const dirPath = path.join(process.cwd(), "tmp", "contacts-imports");
    await mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, `${jobId}.csv`);
    await writeFile(filePath, raw, "utf8");

    const importJob = await this.prisma.contactImportJob.create({
      data: {
        id: jobId,
        workspaceId,
        status: "UPLOADED",
        totalRows: parsed.data.length,
        processedRows: 0,
        errors: [],
        filePath,
      },
    });

    const preview = parsed.data.slice(0, 10);
    return { jobId: importJob.id, preview, detectedColumns };
  }

  async confirmImportJob(
    workspaceId: string,
    userId: string,
    jobId: string,
    dto: ConfirmContactImportDto,
  ): Promise<{ ok: true; jobId: string }> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const importJob = await this.prisma.contactImportJob.findFirst({
      where: { id: jobId, workspaceId },
    });
    if (!importJob) throw new NotFoundException("Import job not found.");
    if (importJob.status !== "UPLOADED") {
      throw new BadRequestException("Import job already confirmed.");
    }

    const mapping = validateColumnMappingShape(dto.columnMapping);
    const csvText = await readFile(importJob.filePath, "utf8");
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    const columns = parsed.meta.fields ?? [];
    for (const column of [mapping.email, mapping.firstName, mapping.lastName].filter(Boolean)) {
      if (!columns.includes(column as string)) {
        throw new BadRequestException(`Column '${column}' does not exist in CSV.`);
      }
    }

    // Plan-limit pre-check using a worst-case estimate (every row is a brand
    // new contact). The processor re-checks per chunk for tighter accuracy.
    await this.billing.assertCanAddContacts(workspaceId, parsed.data.length);

    await this.prisma.contactImportJob.update({
      where: { id: importJob.id },
      data: { status: "QUEUED" },
    });
    await this.importQueue.add(
      CONTACTS_IMPORT_JOB,
      { jobId: importJob.id, workspaceId, columnMapping: mapping },
      { jobId: importJob.id, removeOnComplete: true, removeOnFail: 20 },
    );
    return { ok: true, jobId: importJob.id };
  }

  async getImportJob(workspaceId: string, userId: string, jobId: string): Promise<ContactImportJobDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.contactImportJob.findFirst({
      where: { id: jobId, workspaceId },
    });
    if (!row) throw new NotFoundException("Import job not found.");
    return toContactImportJobDto(row);
  }

  private async assertContactInWorkspace(workspaceId: string, contactId: string): Promise<void> {
    const found = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Contact not found.");
  }

  private async buildWhere(
    workspaceId: string,
    query: ListContactsQueryDto,
  ): Promise<Prisma.ContactWhereInput> {
    const and: Prisma.ContactWhereInput[] = [{ workspaceId }];

    if (query.search?.trim()) {
      const needle = query.search.trim();
      and.push({
        OR: [
          { email: { contains: needle, mode: "insensitive" } },
          { firstName: { contains: needle, mode: "insensitive" } },
          { lastName: { contains: needle, mode: "insensitive" } },
        ],
      });
    }

    if (query.segmentId) {
      const segment = await this.prisma.segment.findFirst({
        where: { id: query.segmentId, workspaceId },
      });
      if (!segment) throw new NotFoundException("Segment not found.");
      const parsed = SegmentQuerySchema.parse(segment.query);

      and.push(buildPrismaWhere(workspaceId, parsed));
    }

    return { AND: and };
  }

  private makeImportJobId(): string {
    return `cij_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
