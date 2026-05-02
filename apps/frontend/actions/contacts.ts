import { z } from "zod";
import { ContactSchema, ContactStatusSchema } from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const CreateContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  status: ContactStatusSchema.optional(),
  customFields: z.record(z.string(), z.string()).optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;

const ContactListSchema = z.object({
  items: z.array(ContactSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

const ImportPreviewSchema = z.object({
  jobId: z.string().min(1),
  preview: z.array(z.record(z.string(), z.string())),
  detectedColumns: z.array(z.string()),
});

const ColumnMappingSchema = z.object({
  email: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const ConfirmImportSchema = z.object({
  columnMapping: ColumnMappingSchema,
});

const ImportConfirmResultSchema = z.object({
  ok: z.literal(true),
  jobId: z.string().min(1),
});

const ImportJobStatusSchema = z.enum([
  "UPLOADED",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

const ImportRowErrorSchema = z.object({
  row: z.number().int().nonnegative(),
  email: z.string().optional(),
  reason: z.string(),
});

const ContactImportJobSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  status: ImportJobStatusSchema,
  totalRows: z.number().int().nonnegative(),
  processedRows: z.number().int().nonnegative(),
  errors: z.array(ImportRowErrorSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const AssignContactTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

export type ListContactsInput = {
  segmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type UploadContactsCsvResult = z.infer<typeof ImportPreviewSchema>;
export type ContactImportJob = z.infer<typeof ContactImportJobSchema>;
export type ConfirmContactImportInput = z.infer<typeof ConfirmImportSchema>;

export const contactsKeys = {
  all: ["contacts"] as const,
  list: (input: ListContactsInput = {}) => [...contactsKeys.all, "list", input] as const,
  importJob: (jobId: string) => [...contactsKeys.all, "import-job", jobId] as const,
};

function toQueryString(input: ListContactsInput): string {
  const params = new URLSearchParams();
  if (input.segmentId) params.set("segmentId", input.segmentId);
  if (input.search) params.set("search", input.search);
  if (input.page) params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  const raw = params.toString();
  return raw ? `?${raw}` : "";
}

export const contactsApi = {
  list: async (input: ListContactsInput = {}) => {
    const raw = await fetcher.get<unknown>(`/contacts${toQueryString(input)}`);
    return ContactListSchema.parse(raw);
  },
  create: async (input: CreateContactInput) => {
    const body = CreateContactSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateContactInput>("/contacts", body);
    return ContactSchema.parse(raw);
  },
  uploadCsv: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const raw = await fetcher.post<unknown, FormData>("/contacts/import", form);
    return ImportPreviewSchema.parse(raw);
  },
  confirmImport: async (jobId: string, input: ConfirmContactImportInput) => {
    const body = ConfirmImportSchema.parse(input);
    const raw = await fetcher.post<unknown, ConfirmContactImportInput>(
      `/contacts/import/${jobId}/confirm`,
      body,
    );
    return ImportConfirmResultSchema.parse(raw);
  },
  getImportJob: async (jobId: string) => {
    const raw = await fetcher.get<unknown>(`/contacts/import/${jobId}`);
    return ContactImportJobSchema.parse(raw);
  },
  assignTags: async (contactId: string, tagIds: string[]) => {
    const body = AssignContactTagsSchema.parse({ tagIds });
    const raw = await fetcher.post<unknown, z.infer<typeof AssignContactTagsSchema>>(
      `/contacts/${contactId}/tags`,
      body,
    );
    return ContactSchema.parse(raw);
  },
};
