import { AdminDashboardSchema, type AdminDashboard } from "@madoo/shared";
import { adminFetch } from "@/lib/api";

export async function fetchDashboard(): Promise<AdminDashboard> {
  const raw = await adminFetch<AdminDashboard>("/admin/analytics/dashboard");
  return AdminDashboardSchema.parse(raw);
}
