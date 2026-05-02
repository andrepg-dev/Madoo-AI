import { z } from "zod";
import { CreateDomainInputSchema, DomainSchema, type CreateDomainInput } from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const DomainListSchema = z.array(DomainSchema);

export const domainsKeys = {
  all: ["domains"] as const,
  list: () => [...domainsKeys.all, "list"] as const,
  detail: (domainId: string) => [...domainsKeys.all, "detail", domainId] as const,
};

export const domainsApi = {
  list: async () => {
    const raw = await fetcher.get<unknown>("/domains");
    return DomainListSchema.parse(raw);
  },
  getById: async (domainId: string) => {
    const raw = await fetcher.get<unknown>(`/domains/${domainId}`);
    return DomainSchema.parse(raw);
  },
  create: async (input: CreateDomainInput) => {
    const body = CreateDomainInputSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateDomainInput>("/domains", body);
    return DomainSchema.parse(raw);
  },
  recheck: async (domainId: string) => {
    const raw = await fetcher.post<unknown, Record<string, never>>(`/domains/${domainId}/recheck`, {});
    return z.object({ ok: z.literal(true) }).parse(raw);
  },
  remove: async (domainId: string) => {
    const raw = await fetcher.delete<unknown>(`/domains/${domainId}`);
    return z.object({ ok: z.literal(true) }).parse(raw);
  },
};
