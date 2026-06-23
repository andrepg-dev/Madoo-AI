import type { Metadata } from "next";
import TemplatesGallery from "../../components/TemplatesGallery";
import { fetchLandingCommunityTemplates } from "../../lib/community-templates";

export const metadata: Metadata = {
  title: "Email Templates — Madoo AI",
  description:
    "Free, ready-to-use email templates for every campaign and occasion. Pick one, then make it yours with AI.",
};

export default async function TemplatesPage() {
  const templates = await fetchLandingCommunityTemplates();

  return <TemplatesGallery templates={templates} />;
}
