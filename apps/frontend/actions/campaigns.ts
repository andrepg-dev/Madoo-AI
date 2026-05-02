import { z } from "zod";
import {
  CampaignSchema,
  CampaignRecipientSchema,
  CreateCampaignInputSchema,
  UpdateCampaignInputSchema,
  CampaignSendTestResponseSchema,
  CampaignEnqueueSendResponseSchema,
  type Campaign,
  type CampaignRecipient,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type CampaignSendTestResponse,
  type CampaignEnqueueSendResponse,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const CampaignListSchema = z.array(CampaignSchema);
const CampaignRecipientListSchema = z.array(CampaignRecipientSchema);

export const campaignsKeys = {
  all: ["campaigns"] as const,
  list: () => [...campaignsKeys.all, "list"] as const,
  detail: (id: string) => [...campaignsKeys.all, "detail", id] as const,
  recipients: (id: string) => [...campaignsKeys.all, "recipients", id] as const,
};

export type { Campaign, CampaignRecipient, CreateCampaignInput, UpdateCampaignInput };

export const campaignsApi = {
  list: async (): Promise<Campaign[]> => {
    const raw = await fetcher.get<unknown>("/campaigns");
    return CampaignListSchema.parse(raw);
  },
  get: async (campaignId: string): Promise<Campaign> => {
    const raw = await fetcher.get<unknown>(`/campaigns/${campaignId}`);
    return CampaignSchema.parse(raw);
  },
  listRecipients: async (campaignId: string): Promise<CampaignRecipient[]> => {
    const raw = await fetcher.get<unknown>(`/campaigns/${campaignId}/recipients`);
    return CampaignRecipientListSchema.parse(raw);
  },
  create: async (input: CreateCampaignInput): Promise<Campaign> => {
    const body = CreateCampaignInputSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateCampaignInput>("/campaigns", body);
    return CampaignSchema.parse(raw);
  },
  update: async (campaignId: string, input: UpdateCampaignInput): Promise<Campaign> => {
    const body = UpdateCampaignInputSchema.parse(input);
    const raw = await fetcher.patch<unknown, UpdateCampaignInput>(`/campaigns/${campaignId}`, body);
    return CampaignSchema.parse(raw);
  },
  remove: async (campaignId: string): Promise<{ ok: true }> => {
    return fetcher.delete<{ ok: true }>(`/campaigns/${campaignId}`);
  },
  sendTest: async (campaignId: string): Promise<CampaignSendTestResponse> => {
    const raw = await fetcher.post<unknown, Record<string, never>>(`/campaigns/${campaignId}/test`, {});
    return CampaignSendTestResponseSchema.parse(raw);
  },
  send: async (campaignId: string): Promise<CampaignEnqueueSendResponse> => {
    const raw = await fetcher.post<unknown, Record<string, never>>(`/campaigns/${campaignId}/send`, {});
    return CampaignEnqueueSendResponseSchema.parse(raw);
  },
};
