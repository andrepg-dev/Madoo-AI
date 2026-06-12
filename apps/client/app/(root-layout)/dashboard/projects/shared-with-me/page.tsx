"use client";

import { ProjectsFutureState } from "@/components/projects/ProjectLibrary";

export default function SharedWithMePage() {
  return (
    <ProjectsFutureState
      body="Shared project records need backend support before this view can show collaborator access."
      title="Shared with me"
    />
  );
}
