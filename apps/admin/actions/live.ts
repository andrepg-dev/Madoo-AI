import { AdminLiveSchema, type AdminLive } from "@madoo/shared";
import { adminFetch } from "@/lib/api";

export async function fetchLive(): Promise<AdminLive> {
  const raw = await adminFetch<AdminLive>("/admin/analytics/live");
  return AdminLiveSchema.parse(raw);
}
