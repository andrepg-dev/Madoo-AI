"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  BillingOverviewSchema,
  CancelSubscriptionResponseSchema,
  CheckoutSessionResponseSchema,
  CreateCheckoutSessionInputSchema,
  PortalSessionResponseSchema,
  type BillingOverviewDto,
  type CancelSubscriptionResponse,
  type CheckoutSessionResponse,
  type CreateCheckoutSessionInput,
  type PortalSessionResponse,
} from "@madoo/shared";

export type {
  BillingOverviewDto,
  CancelSubscriptionResponse,
  CheckoutSessionResponse,
  CreateCheckoutSessionInput,
  PortalSessionResponse,
} from "@madoo/shared";

export async function fetchBillingOverview(): Promise<BillingOverviewDto> {
  const raw = await FetchWrapper<BillingOverviewDto>("/billing/overview");
  return BillingOverviewSchema.parse(raw);
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResponse> {
  const body = CreateCheckoutSessionInputSchema.parse(input);
  const raw = await FetchWrapper<CheckoutSessionResponse>(
    "/billing/checkout-session",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return CheckoutSessionResponseSchema.parse(raw);
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  const raw = await FetchWrapper<PortalSessionResponse>(
    "/billing/portal-session",
    { method: "POST" },
  );
  return PortalSessionResponseSchema.parse(raw);
}

export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
  const raw = await FetchWrapper<CancelSubscriptionResponse>("/billing/cancel", {
    method: "POST",
  });
  return CancelSubscriptionResponseSchema.parse(raw);
}

export async function resumeSubscription(): Promise<CancelSubscriptionResponse> {
  const raw = await FetchWrapper<CancelSubscriptionResponse>("/billing/resume", {
    method: "POST",
  });
  return CancelSubscriptionResponseSchema.parse(raw);
}
