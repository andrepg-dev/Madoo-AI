"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TemplateSlugSchema } from "@madoo/shared";
import { TemplatePreviewScreen } from "@/components/templates/TemplatePreviewScreen";

export default function TemplatePreviewPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const raw = params?.slug;
  const candidate = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const parsed = TemplateSlugSchema.safeParse(candidate);

  if (!parsed.success) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Unknown template.</p>
      </div>
    );
  }

  const slug = parsed.data;
  const prompt = search?.get("prompt") ?? `Use the "${slug}" template`;
  const tone = search?.get("tone") ?? "Friendly";
  const length = search?.get("length") ?? "Medium";
  const audience = search?.get("audience") ?? "Existing customers";

  return (
    <TemplatePreviewScreen
      slug={slug}
      prompt={prompt}
      tone={tone}
      length={length}
      audience={audience}
      onBack={() => router.push("/")}
    />
  );
}
