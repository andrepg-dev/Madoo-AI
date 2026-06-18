"use client";

import { useParams } from "next/navigation";
import { SettingsView } from "../settings-view";

export default function SettingsSectionPage() {
  const params = useParams<{ section: string | string[] }>();
  const section = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  return <SettingsView section={section ?? "profile"} />;
}
