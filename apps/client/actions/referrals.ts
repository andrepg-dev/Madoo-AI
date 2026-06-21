"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { MyReferralSchema, type MyReferralDto } from "@madoo/shared";

export type { MyReferralDto } from "@madoo/shared";

export async function fetchMyReferral(): Promise<MyReferralDto> {
  const raw = await FetchWrapper<MyReferralDto>("/referrals/me");
  return MyReferralSchema.parse(raw);
}
