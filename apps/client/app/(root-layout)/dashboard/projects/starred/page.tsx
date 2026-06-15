"use client";

import { ProjectLibrary } from "@/components/projects/ProjectLibrary";

export default function StarredPage() {
  return (
    <ProjectLibrary
      title="Starred"
      emptyTitle="No starred projects yet"
      starredOnly
    />
  );
}
