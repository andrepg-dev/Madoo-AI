import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsOfService } from "../../../components/TermsOfService";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Términos del Servicio — Madoo AI",
  description: "Los términos que rigen tu uso de Madoo.",
};

export default async function LocaleTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  return <TermsOfService locale={locale} />;
}
