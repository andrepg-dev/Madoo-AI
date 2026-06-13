"use client";

import { createEmailFromTemplate, fetchEmails } from "@/actions/emails";
import {
  fetchTemplates,
  previewSeedTemplate,
  type TemplateDto,
  type TemplateSlug,
} from "@/actions/templates";
import TemplateCard from "@/components/global/template-card";
import { useAuthStore } from "@/stores/auth-store";
import {
  Button,
  Card,
  Icon,
  Modal,
  SegmentedControl,
  cx,
  useToast,
} from "@madoo/design-system";
import { TemplateSlugSchema, type EmailDto } from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProjectTab = "projects" | "templates";
type SeedTemplateDto = TemplateDto & { slug: TemplateSlug };

const projectTabs = [
  { value: "projects", label: "My emails" },
  { value: "templates", label: "Madoo templates" },
];

function getEmailTitle(email: EmailDto): string {
  const latestVariant = email.variants[email.variants.length - 1];
  return (
    latestVariant?.subject || email.title || email.prompt || "Untitled email"
  );
}

function getEmailSubtitle(email: EmailDto): string {
  const date = new Date(email.updatedAt);
  const formatted = Number.isNaN(date.getTime())
    ? "Updated"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
  return `${email.status.toLowerCase()} - ${formatted}`;
}

function getPreviewUrl(email: EmailDto): string | null {
  return email.variants[email.variants.length - 1]?.previewUrl ?? null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function toSeedTemplate(template: TemplateDto): SeedTemplateDto | null {
  const parsed = TemplateSlugSchema.safeParse(template.slug);
  if (!parsed.success) return null;
  return { ...template, slug: parsed.data };
}

export function ProjectShowCase() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("projects");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SeedTemplateDto | null>(null);

  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    enabled: Boolean(user),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
    enabled: Boolean(user),
  });

  const seedTemplates = useMemo(
    () =>
      templates
        .map(toSeedTemplate)
        .filter((template): template is SeedTemplateDto => Boolean(template))
        .slice(0, 12),
    [templates],
  );

  const recentEmails = useMemo(
    () =>
      [...emails]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 10),
    [emails],
  );

  const previewQuery = useQuery({
    queryKey: ["template-preview", selectedTemplate?.slug],
    queryFn: () => previewSeedTemplate(selectedTemplate!.slug),
    enabled: Boolean(selectedTemplate),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: SeedTemplateDto) =>
      createEmailFromTemplate({
        templateSlug: template.slug,
        prompt:
          template.description ||
          `Create an email from the ${template.name} template.`,
        tone: "Professional",
        length: "Medium",
      }),
    onSuccess: async (email) => {
      setSelectedTemplate(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      ]);
      router.push(`/email-template-project?id=${encodeURIComponent(email.id)}`);
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Template creation failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const loading =
    activeProjectTab === "projects" ? emailsLoading : templatesLoading;
  const activeItems =
    activeProjectTab === "projects" ? recentEmails : seedTemplates;

  return (
    <div className="relative z-10 w-full px-6 py-6">
      <Card
        aria-label="Project gallery"
        className="w-full overflow-hidden rounded-lg! bg-madoo-accent-fg! p-6 pb-9 shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.14)]!"
      >
        <div className="mb-4 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <SegmentedControl
            aria-label="Project view"
            items={projectTabs}
            onChange={(value) => setActiveProjectTab(value as ProjectTab)}
            value={activeProjectTab}
          />
          {activeProjectTab === "projects" ? (
            <Button
              onClick={() => router.push("/dashboard/projects")}
              rightIcon={<Icon name="arrow" size={13} />}
              size="sm"
              variant="ghost"
              className="bg-transparent text-[#101114]"
            >
              Browse
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="grid min-h-60 place-items-center rounded-lg bg-white text-sm text-madoo-ink-muted shadow-madoo-border">
            Loading
          </div>
        ) : activeItems.length ? (
          <div className="grid grid-cols-5 gap-x-5 gap-y-5 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-4">
            {activeProjectTab === "projects"
              ? recentEmails.map((email) => (
                  <TemplateCard
                    avatarLabel={getEmailTitle(email)}
                    badge={
                      email.status === "GENERATING" ? "Generating" : undefined
                    }
                    key={email.id}
                    onClick={() =>
                      router.push(
                        `/email-template-project?id=${encodeURIComponent(email.id)}`,
                      )
                    }
                    previewUrl={getPreviewUrl(email)}
                    subtitle={getEmailSubtitle(email)}
                    title={getEmailTitle(email)}
                  />
                ))
              : seedTemplates.map((template) => (
                  <TemplateCard
                    avatarLabel="Madoo"
                    badge={template.category ?? undefined}
                    key={template.slug}
                    onClick={() => setSelectedTemplate(template)}
                    subtitle={template.description ?? "Seed template"}
                    title={template.name}
                  />
                ))}
          </div>
        ) : (
          <div className="grid min-h-60 place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border">
            <div className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-lg bg-madoo-bg-2 text-madoo-ink-muted">
                <Icon
                  name={activeProjectTab === "projects" ? "folder" : "image"}
                  size={20}
                />
              </span>
              <h3 className="m-0 text-[15px] font-medium text-madoo-ink">
                {activeProjectTab === "projects"
                  ? "No emails yet"
                  : "No templates yet"}
              </h3>
              <p className="m-0 max-w-sm text-[13px] leading-5 text-madoo-ink-muted">
                {user
                  ? "New items will appear here."
                  : "Sign in to load this workspace."}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Modal
        footer={
          <>
            <Button
              onClick={() => setSelectedTemplate(null)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedTemplate || createTemplateMutation.isPending}
              onClick={() =>
                selectedTemplate
                  ? createTemplateMutation.mutate(selectedTemplate)
                  : undefined
              }
              size="sm"
              variant="primary"
            >
              {createTemplateMutation.isPending ? "Creating" : "Use template"}
            </Button>
          </>
        }
        onClose={() => setSelectedTemplate(null)}
        open={Boolean(selectedTemplate)}
        size="xl"
        title={selectedTemplate?.name}
      >
        <div
          className={cx(
            "overflow-hidden rounded-lg bg-white shadow-madoo-border",
            previewQuery.isLoading && "grid min-h-105 place-items-center",
          )}
        >
          {previewQuery.isLoading ? (
            <span className="text-sm text-madoo-ink-muted">Loading preview</span>
          ) : previewQuery.data?.compiledHtml ? (
            <iframe
              className="h-130 w-full border-0 bg-white"
              sandbox=""
              srcDoc={previewQuery.data.compiledHtml}
              title={`${selectedTemplate?.name ?? "Template"} preview`}
            />
          ) : (
            <div className="grid min-h-80 place-items-center text-sm text-madoo-ink-muted">
              Preview unavailable
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
