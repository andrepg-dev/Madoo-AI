import {
  AdminRetentionOverviewSchema,
  type AdminRetentionOverview,
} from "@madoo/shared";
import { adminFetch } from "@/lib/api";

export async function fetchRetention(): Promise<AdminRetentionOverview> {
  const raw = await adminFetch<AdminRetentionOverview>(
    "/admin/analytics/retention",
  );
  return AdminRetentionOverviewSchema.parse(raw);
}
