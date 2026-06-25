import type { Metadata } from "next";
import { SecurityPage } from "../../components/SecurityPage";

export const metadata: Metadata = {
  title: "Security — Madoo AI",
  description: "How Madoo protects your account and your data.",
};

export default function SecurityRoute() {
  return <SecurityPage locale="en" />;
}
