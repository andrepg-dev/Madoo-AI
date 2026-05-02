import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime();

export const DomainStatusSchema = z.enum(["pending", "verified"]);

export const DnsCheckTypeSchema = z.enum(["spf", "dkim", "dmarc", "return_path"]);

export const DnsRecordSchema = z.object({
  type: z.enum(["TXT", "CNAME"]),
  host: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
});

export const DnsCheckSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  domainId: z.string().min(1),
  type: DnsCheckTypeSchema,
  hostname: z.string().min(1),
  expected: z.string().min(1),
  actual: z.string().optional(),
  ok: z.boolean(),
  checkedAt: IsoDateTimeSchema,
});

export const DomainSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  hostname: z.string().min(1),
  status: DomainStatusSchema,
  dkimPublicKey: z.string().min(1),
  verifiedAt: IsoDateTimeSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  dnsRecords: z.array(DnsRecordSchema),
  latestChecks: z.array(DnsCheckSchema),
});

export const CreateDomainInputSchema = z.object({
  hostname: z.string().min(3).max(255),
});

export type DomainStatus = z.infer<typeof DomainStatusSchema>;
export type DnsCheckType = z.infer<typeof DnsCheckTypeSchema>;
export type DnsRecord = z.infer<typeof DnsRecordSchema>;
export type DnsCheck = z.infer<typeof DnsCheckSchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type CreateDomainInput = z.infer<typeof CreateDomainInputSchema>;
