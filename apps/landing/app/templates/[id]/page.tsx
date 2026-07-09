import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplateDetail from "../../../components/TemplateDetail";
import {
  fetchLandingCommunityTemplate,
  fetchLandingCommunityTemplates,
} from "../../../lib/community-templates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const template = await fetchLandingCommunityTemplate(id);
  if (!template) {
    return { title: "Email Template — Madoo AI" };
  }
  const description =
    template.description ??
    "Preview this email template, then make it yours with AI.";
  return {
    title: `${template.name} — Madoo AI`,
    description,
    openGraph: {
      title: `${template.name} — Madoo AI`,
      description,
      images: template.previewUrl ? [template.previewUrl] : undefined,
    },
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, all] = await Promise.all([
    fetchLandingCommunityTemplate(id),
    fetchLandingCommunityTemplates(),
  ]);

  if (!template) notFound();

  const recommended = all.filter((item) => item.id !== id).slice(0, 10);

  return <TemplateDetail template={template} recommended={recommended} />;
}
