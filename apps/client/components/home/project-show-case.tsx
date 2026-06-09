"use client";

import { Card, SegmentedControl } from "@madoo/design-system";
import { useState } from "react";
import TemplateCard from "../global/template-card";

const projectTabs = [
  { value: "projects", label: "My emails" },
  { value: "templates", label: "Madoo templates" },
];

const projects = [
  { id: "project-1", title: "Email template draft" },
  { id: "project-2", title: "Email template draft" },
  { id: "project-3", title: "Email template draft" },
  { id: "project-4", title: "Email template draft" },
  { id: "project-5", title: "Email template draft" },
  { id: "project-6", title: "Email template draft" },
  { id: "project-7", title: "Email template draft" },
  { id: "project-8", title: "Email template draft" },
];

export function ProjectShowCase() {
  const [activeProjectTab, setActiveProjectTab] = useState("projects");

  return (
    <div className="relative z-10 w-full px-6 py-6">
      <Card
        className="w-full overflow-hidden rounded-[22px]! bg-madoo-accent-fg! p-8 pt-4 pb-12 shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.14)]!"
        aria-label="Project gallery"
      >
        <div className="mb-4.5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <SegmentedControl
            items={projectTabs}
            value={activeProjectTab}
            onChange={setActiveProjectTab}
            aria-label="Project view"
          />

          {/* <Button
            variant="ghost"
            size="sm"
            rightIcon={<Icon name="arrow" size={13} />}
            className="bg-transparent text-[#101114]"
          >
            Browse all
          </Button> */}
        </div>

        <div className="grid grid-cols-5 gap-x-5.5 gap-y-5 max-[900px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-4">
          {projects.map((project) => (
            <TemplateCard key={project.id} project={project} />
          ))}
        </div>
      </Card>
    </div>
  );
}
