import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SecurityPage } from "../../../components/SecurityPage";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Seguridad — Madoo AI",
  description: "Cómo Madoo protege tu cuenta y tus datos.",
};

export default async function LocaleSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  return <SecurityPage locale={locale} />;
}
