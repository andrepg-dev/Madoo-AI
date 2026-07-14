import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Changelog } from "../../../components/Changelog";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Novedades — Madoo AI",
  description: "Las últimas mejoras y actualizaciones de Madoo.",
};

export default async function LocaleChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  return <Changelog locale={locale} />;
}
