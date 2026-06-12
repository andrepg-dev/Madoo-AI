"use client";

import { ProjectsFutureState } from "@/components/projects/ProjectLibrary";

export default function StarredPage() {
  return (
    <ProjectsFutureState
      body="Starred projects need backend support before this view can show saved favorites."
      title="Starred"
    />
  );
}
