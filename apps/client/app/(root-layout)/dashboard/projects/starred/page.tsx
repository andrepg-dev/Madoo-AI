"use client";

import {
  ArrowDown01Icon,
  Folder01Icon,
  Grid2X2Icon,
  ListViewIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, GroupButtons, Input, Select, cx } from "@madoo/design-system";
import { useState } from "react";

type ViewMode = "grid" | "list";

function ProjectIcon({
  icon,
  size = 18,
}: {
  icon: IconSvgElement;
  size?: number;
}) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      focusable="false"
      icon={icon}
      primaryColor="currentColor"
      size={size}
      strokeWidth={1.5}
    />
  );
}

export default function StarredPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Any status");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="min-h-full bg-[var(--madoo-page)] px-6 py-6 text-madoo-ink max-sm:px-4 max-sm:py-4">
      <div className="mx-auto max-w-[1580px]">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold leading-none tracking-normal text-[#202124]">
            Starred
          </h1>
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ProjectIcon icon={ArrowDown01Icon} size={13} />}
          >
            Create
          </Button>
        </header>

        <div className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(128px,160px))_auto] items-center gap-2 max-[1180px]:grid-cols-2 max-sm:grid-cols-1">
          <Input
            inputSize="md"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            startAdornment={<ProjectIcon icon={Search01Icon} size={15} />}
            className="h-9! rounded-[9px]!"
          />
          <Select
            label="Sort projects"
            value="Last edited"
            onChange={() => undefined}
            size="sm"
            variant="default"
            options={["Last edited", "Created", "Project name"]}
          />
          <Select
            label="Filter by visibility"
            value="Any visibility"
            onChange={() => undefined}
            size="sm"
            variant="default"
            options={["Any visibility", "Private", "Workspace"]}
          />
          <Select
            label="Filter by status"
            value={status}
            onChange={setStatus}
            size="sm"
            variant="default"
            options={["Any status", "Draft", "Published", "Generating"]}
          />
          <Select
            label="Filter by creator"
            value="All creators"
            onChange={() => undefined}
            size="sm"
            variant="default"
            options={["All creators", "Andre Ponce"]}
          />
          <div className="flex items-center justify-end max-sm:justify-end">
            <GroupButtons
              aria-label="Project view"
              size="sm"
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              items={[
                {
                  value: "grid",
                  label: "Grid view",
                  icon: (
                    <ProjectIcon
                      key="grid-view-icon"
                      icon={Grid2X2Icon}
                      size={16}
                    />
                  ),
                },
                {
                  value: "list",
                  label: "List view",
                  icon: (
                    <ProjectIcon
                      key="list-view-icon"
                      icon={ListViewIcon}
                      size={15}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>

        <section className="mt-5">
          <h2 className="mb-3 text-[15px] font-semibold leading-none text-madoo-ink-muted">
            Templates
          </h2>
          <div
            className={cx(
              "grid min-h-[260px] place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border",
              viewMode === "list" && "min-h-[180px]",
            )}
          >
            <div className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-lg bg-madoo-bg-2 text-madoo-ink-muted">
                <ProjectIcon icon={Folder01Icon} size={20} />
              </span>
              <h3 className="m-0 text-[15px] font-medium text-madoo-ink">
                No templates yet
              </h3>
              <p className="m-0 max-w-sm text-[13px] leading-5 text-madoo-ink-muted">
                Created templates will appear here.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
