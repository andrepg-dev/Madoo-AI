import type { Metadata } from "next";
import { SettingsView } from "../settings-view";

const sectionTitles: Record<string, string> = {
  profile: "Profile Settings",
  billing: "Billing & Usage",
  referral: "Refer & Earn",
  sound: "Completion Sound",
  general: "Workspace Settings",
  avatar: "Workspace Avatar",
  members: "Workspace Members",
  danger: "Workspace Danger Zone",
  support: "Support",
};

type SettingsSectionProps = {
  params: Promise<{ section: string | string[] }>;
};

function normalizeSection(section: string | string[] | undefined) {
  return Array.isArray(section) ? section[0] : section;
}

export async function generateMetadata({
  params,
}: SettingsSectionProps): Promise<Metadata> {
  const { section } = await params;
  const slug = normalizeSection(section) ?? "profile";

  return {
    title: sectionTitles[slug] ?? "Settings",
  };
}

export default async function SettingsSectionPage({
  params,
}: SettingsSectionProps) {
  const { section } = await params;
  const slug = normalizeSection(section) ?? "profile";

  return <SettingsView section={slug} />;
}
