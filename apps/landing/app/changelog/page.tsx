import type { Metadata } from "next";
import { Changelog } from "../../components/Changelog";

export const metadata: Metadata = {
  title: "What's new — Madoo AI",
  description: "The latest improvements and updates to Madoo.",
};

export default function ChangelogPage() {
  return <Changelog locale="en" />;
}
