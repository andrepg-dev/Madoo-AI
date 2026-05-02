import type { ContactImportJob } from "@prisma/client";

export type ContactImportJobDto = {
  id: string;
  workspaceId: string;
  status: ContactImportJob["status"];
  totalRows: number;
  processedRows: number;
  errors: unknown[];
  createdAt: string;
  updatedAt: string;
};

export function toContactImportJobDto(job: ContactImportJob): ContactImportJobDto {
  return {
    id: job.id,
    workspaceId: job.workspaceId,
    status: job.status,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    errors: Array.isArray(job.errors) ? job.errors : [],
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
