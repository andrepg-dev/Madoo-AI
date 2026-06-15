import { notFound } from "next/navigation";
import HomePage from "../../components/HomePage";
import { fetchLandingCommunityTemplates } from "../../lib/community-templates";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  const communityTemplates = await fetchLandingCommunityTemplates();

  return <HomePage locale={locale} communityTemplates={communityTemplates} />;
}
