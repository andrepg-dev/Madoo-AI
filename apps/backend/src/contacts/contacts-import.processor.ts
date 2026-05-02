import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import Papa from "papaparse";
import { readFile } from "node:fs/promises";
import { CONTACTS_IMPORT_JOB, CONTACTS_IMPORT_QUEUE, type ContactImportJobPayload, type ContactImportRowError } from "./contacts-import.types";
import { PrismaService } from "../prisma/prisma.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

@Injectable()
@Processor(CONTACTS_IMPORT_QUEUE)
export class ContactsImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ContactsImportProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ContactImportJobPayload>): Promise<void> {
    if (job.name !== CONTACTS_IMPORT_JOB) return;

    const importJob = await this.prisma.contactImportJob.findUnique({
      where: { id: job.data.jobId },
    });
    if (!importJob) return;

    try {
      await this.prisma.contactImportJob.update({
        where: { id: importJob.id },
        data: { status: "PROCESSING", errors: [], processedRows: 0 },
      });

      const csvText = await readFile(importJob.filePath, "utf8");
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      const rows = parsed.data;

      const errors: ContactImportRowError[] = [];
      let processedRows = 0;
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        for (let idx = 0; idx < chunk.length; idx += 1) {
          const rowIndex = i + idx;
          const row = chunk[idx];
          const emailRaw = (row[job.data.columnMapping.email] ?? "").trim().toLowerCase();

          if (!EMAIL_RE.test(emailRaw)) {
            errors.push({
              row: rowIndex + 2,
              email: emailRaw || undefined,
              reason: "Malformed email",
            });
            continue;
          }

          const firstName = job.data.columnMapping.firstName
            ? (row[job.data.columnMapping.firstName] ?? "").trim() || null
            : null;
          const lastName = job.data.columnMapping.lastName
            ? (row[job.data.columnMapping.lastName] ?? "").trim() || null
            : null;

          const mappedColumns = new Set(
            [
              job.data.columnMapping.email,
              job.data.columnMapping.firstName,
              job.data.columnMapping.lastName,
            ].filter(Boolean),
          );
          const customFields: Record<string, string> = {};
          for (const [column, value] of Object.entries(row)) {
            if (mappedColumns.has(column)) continue;
            if (typeof value === "string" && value.trim().length > 0) {
              customFields[column] = value.trim();
            }
          }

          try {
            await this.prisma.contact.upsert({
              where: {
                workspaceId_email: {
                  workspaceId: job.data.workspaceId,
                  email: emailRaw,
                },
              },
              update: {
                firstName,
                lastName,
                customFields,
              },
              create: {
                workspaceId: job.data.workspaceId,
                email: emailRaw,
                firstName,
                lastName,
                customFields,
              },
            });
            processedRows += 1;
          } catch (error) {
            errors.push({
              row: rowIndex + 2,
              email: emailRaw,
              reason: error instanceof Error ? error.message : "Unknown import error",
            });
          }
        }

        await this.prisma.contactImportJob.update({
          where: { id: importJob.id },
          data: { processedRows, errors },
        });
      }

      await this.prisma.contactImportJob.update({
        where: { id: importJob.id },
        data: {
          status: "COMPLETED",
          processedRows,
          totalRows: rows.length,
          errors,
        },
      });
    } catch (error) {
      this.logger.error("contacts-import failed", error instanceof Error ? error.stack : "");
      const reason = error instanceof Error ? error.message : "Unknown import failure";
      const current = await this.prisma.contactImportJob.findUnique({
        where: { id: importJob.id },
        select: { errors: true },
      });
      const mergedErrors = Array.isArray(current?.errors) ? current.errors : [];
      mergedErrors.push({ row: 0, reason });
      await this.prisma.contactImportJob.update({
        where: { id: importJob.id },
        data: {
          status: "FAILED",
          errors: mergedErrors,
        },
      });
      throw error;
    }
  }
}
