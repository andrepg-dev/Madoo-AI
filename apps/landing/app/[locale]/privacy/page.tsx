import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacyPolicy } from "../../../components/PrivacyPolicy";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Política de Privacidad — Madoo AI",
  description:
    "Cómo Madoo recopila, usa, comparte y protege tus datos personales.",
};

export default async function LocalePrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  return <PrivacyPolicy locale={locale} />;
}
