import {
  AdminEmailDetailSchema,
  AdminEmailListSchema,
  type AdminEmailDetail,
  type AdminEmailList,
} from "@madoo/shared";
import { adminFetch } from "@/lib/api";

export async function fetchEmails(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<AdminEmailList> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  const raw = await adminFetch<AdminEmailList>(`/admin/emails?${query.toString()}`);
  return AdminEmailListSchema.parse(raw);
}

export async function fetchEmailDetail(id: string): Promise<AdminEmailDetail> {
  const raw = await adminFetch<AdminEmailDetail>(
    `/admin/emails/${encodeURIComponent(id)}`,
  );
  return AdminEmailDetailSchema.parse(raw);
}
