"use client";

import { Button, Card, Icon, SegmentedControl } from "@madoo/design-system";
import { useState } from "react";

const projectTabs = [
  { value: "projects", label: "My projects" },
  { value: "recent", label: "Recently viewed" },
  { value: "templates", label: "Madoo templates" },
];

const projects = [
  { id: "project-1", title: "Project draft" },
  { id: "project-2", title: "Project draft" },
  { id: "project-3", title: "Project draft" },
  { id: "project-4", title: "Project draft" },
  { id: "project-5", title: "Project draft" },
  { id: "project-6", title: "Project draft" },
  { id: "project-7", title: "Project draft" },
  { id: "project-8", title: "Project draft" },
];

export function ProjectShowCase() {
  const [activeProjectTab, setActiveProjectTab] = useState("projects");

  return (
    <div className="relative z-10 w-full px-6 py-6">
      <Card
        className="w-full overflow-hidden !rounded-[22px] bg-madoo-accent-fg! p-8 pt-4 pb-12 !shadow-[inset_0_0_0_0.5px_rgb(12_52_106_/_0.14)]"
        aria-label="Project gallery"
      >
        <div className="mb-[18px] flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <SegmentedControl
            items={projectTabs}
            value={activeProjectTab}
            onChange={setActiveProjectTab}
            aria-label="Project view"
          />

          <Button
            variant="ghost"
            size="sm"
            rightIcon={<Icon name="arrow" size={13} />}
            className="bg-transparent text-[#101114]"
          >
            Browse all
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-x-[22px] gap-y-5 max-[900px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-4">
          {projects.map((project) => (
            <article className="min-w-0" key={project.id}>
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106_/_0.16)]">
                <Icon name="image" size={32} className="text-[#f2f0ea]" />
              </div>

              <div className="mt-2.5 grid grid-cols-[28px_minmax(0,1fr)] items-start gap-1.5">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#7224aa] text-sm text-white">
                  A
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
                    {project.title}
                  </h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
