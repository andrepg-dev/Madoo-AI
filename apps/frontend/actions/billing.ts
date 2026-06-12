import {
  BillingOverviewSchema,
  CheckoutSessionResponseSchema,
  CreateCheckoutSessionInputSchema,
  PortalSessionResponseSchema,
  type BillingOverviewDto,
  type CheckoutSessionResponse,
  type CreateCheckoutSessionInput,
  type PortalSessionResponse,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

export const billingKeys = {
  all: ["billing"] as const,
  overview: () => [...billingKeys.all, "overview"] as const,
};

export const billingApi = {
  overview: async (): Promise<BillingOverviewDto> => {
    const raw = await fetcher.get<unknown>("/billing/overview");
    return BillingOverviewSchema.parse(raw);
  },
  createCheckoutSession: async (
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResponse> => {
    const body = CreateCheckoutSessionInputSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateCheckoutSessionInput>(
      "/billing/checkout-session",
      body,
    );
    return CheckoutSessionResponseSchema.parse(raw);
  },
  createPortalSession: async (): Promise<PortalSessionResponse> => {
    const raw = await fetcher.post<unknown, Record<string, never>>(
      "/billing/portal-session",
      {},
    );
    return PortalSessionResponseSchema.parse(raw);
  },
};

export type { BillingOverviewDto, CheckoutSessionResponse, PortalSessionResponse };
