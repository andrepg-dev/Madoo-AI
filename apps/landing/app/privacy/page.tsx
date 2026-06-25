import type { Metadata } from "next";
import { PrivacyPolicy } from "../../components/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy — Madoo AI",
  description:
    "How Madoo collects, uses, shares and protects your personal data.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy locale="en" />;
}
