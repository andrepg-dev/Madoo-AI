import { fetcher } from "@/lib/fetch";

export const templatesApi = {
  saveFromVariant: async (variantId: string, name: string): Promise<{ id: string; name: string; slug: string }> => {
    return fetcher.post("/templates/from-variant", { variantId, name });
  },
};
