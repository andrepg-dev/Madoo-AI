import type { Metadata } from "next";
import { TermsOfService } from "../../components/TermsOfService";

export const metadata: Metadata = {
  title: "Terms of Service — Madoo AI",
  description: "The terms that govern your use of Madoo.",
};

export default function TermsPage() {
  return <TermsOfService locale="en" />;
}
