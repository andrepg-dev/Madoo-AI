"use client";

import {
  createEmailFromTemplate,
  fetchEmails,
  setEmailStarred,
} from "@/actions/emails";
import {
  fetchCommunityTemplate,
  fetchCommunityTemplates,
  setCommunityTemplateStarred,
  shareEmailToCommunity,
  useCommunityTemplate,
  type CommunityTemplateDetailDto,
  type CommunityTemplateDto,
  type ShareEmailToCommunityInput,
} from "@/actions/community-templates";
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
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Icon,
  Input,
  Modal,
  SegmentedControl,
  Textarea,
  cx,
  useToast,
} from "@madoo/design-system";
import {
  TemplateSlugSchema,
  type EmailDto,
  type VariableSchemaRoot,
  type VariableSpec,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProjectTab = "projects" | "templates" | "community";
type SeedTemplateDto = TemplateDto & { slug: TemplateSlug };

const projectTabs = [
  { value: "projects", label: "My emails" },
  { value: "templates", label: "Madoo templates" },
  { value: "community", label: "Community" },
];

const compactMenuItemClass = "justify-start! px-2! py-1.5! text-[13px]!";

const roleLabels: Record<NonNullable<VariableSpec["role"]>, string> = {
  text: "Text",
  url: "URL",
  image: "Image",
  date: "Date",
};

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

function getCommunitySubtitle(template: CommunityTemplateDto): string {
  return template.authorName || template.category || "Community";
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

function cloneSchema(schema: VariableSchemaRoot): VariableSchemaRoot {
  return {
    variables: schema.variables.map((variable) => ({ ...variable })),
  };
}

function inputTypeForRole(role: VariableSpec["role"]): string {
  if (role === "url" || role === "image") return "url";
  if (role === "date") return "date";
  return "text";
}

function defaultScope(variable: VariableSpec): "dynamic" | "static" {
  return variable.scope ?? "dynamic";
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
  const [shareTarget, setShareTarget] = useState<EmailDto | null>(null);
  const [selectedCommunityTemplateId, setSelectedCommunityTemplateId] =
    useState<string | null>(null);

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

  const {
    data: communityTemplates = [],
    isLoading: communityTemplatesLoading,
  } = useQuery({
    queryKey: ["community-templates"],
    queryFn: fetchCommunityTemplates,
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

  const communityPreview = useMemo(
    () =>
      communityTemplates.find(
        (item) => item.id === selectedCommunityTemplateId,
      ),
    [communityTemplates, selectedCommunityTemplateId],
  );

  const previewQuery = useQuery({
    queryKey: ["template-preview", selectedTemplate?.slug],
    queryFn: () => previewSeedTemplate(selectedTemplate!.slug),
    enabled: Boolean(selectedTemplate),
  });

  const communityDetailQuery = useQuery({
    queryKey: ["community-template", selectedCommunityTemplateId],
    queryFn: () => fetchCommunityTemplate(selectedCommunityTemplateId!),
    enabled: Boolean(selectedCommunityTemplateId),
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

  const emailStarMutation = useMutation({
    mutationFn: ({ email, starred }: { email: EmailDto; starred: boolean }) =>
      setEmailStarred(email.id, starred),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData<EmailDto[]>(
        ["emails"],
        (current) =>
          current?.map((email) =>
            email.id === updatedEmail.id ? updatedEmail : email,
          ) ?? [],
      );
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not update star",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const communityStarMutation = useMutation({
    mutationFn: ({
      template,
      starred,
    }: {
      template: CommunityTemplateDto;
      starred: boolean;
    }) => setCommunityTemplateStarred(template.id, starred),
    onSuccess: (updatedTemplate) => {
      queryClient.setQueryData<CommunityTemplateDto[]>(
        ["community-templates"],
        (current) =>
          current?.map((template) =>
            template.id === updatedTemplate.id ? updatedTemplate : template,
          ) ?? [],
      );
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not update star",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: shareEmailToCommunity,
    onSuccess: async () => {
      setShareTarget(null);
      await queryClient.invalidateQueries({
        queryKey: ["community-templates"],
      });
      toast({ tone: "success", title: "Shared to community" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Share failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const useCommunityMutation = useMutation({
    mutationFn: ({
      id,
      variableSchema,
    }: {
      id: string;
      variableSchema: VariableSchemaRoot;
    }) => useCommunityTemplate(id, variableSchema),
    onSuccess: async (email) => {
      setSelectedCommunityTemplateId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
        queryClient.invalidateQueries({ queryKey: ["community-templates"] }),
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
    activeProjectTab === "projects"
      ? emailsLoading
      : activeProjectTab === "templates"
        ? templatesLoading
        : communityTemplatesLoading;

  const activeCount =
    activeProjectTab === "projects"
      ? recentEmails.length
      : activeProjectTab === "templates"
        ? seedTemplates.length
        : communityTemplates.length;

  const emptyCopy =
    activeProjectTab === "projects"
      ? "No emails yet"
      : activeProjectTab === "templates"
        ? "No templates yet"
        : "No community templates yet";

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
        ) : activeCount ? (
          <div className="grid grid-cols-5 gap-x-5 gap-y-5 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-4">
            {activeProjectTab === "projects"
              ? recentEmails.map((email) => (
                  <TemplateCard
                    avatarLabel={getEmailTitle(email)}
                    badge={
                      email.status === "GENERATING" ? "Generating" : undefined
                    }
                    key={email.id}
                    menu={
                      <EmailCardMenu
                        email={email}
                        onShare={(nextEmail) => setShareTarget(nextEmail)}
                      />
                    }
                    onClick={() =>
                      router.push(
                        `/email-template-project?id=${encodeURIComponent(email.id)}`,
                      )
                    }
                    onToggleStar={() =>
                      emailStarMutation.mutate({
                        email,
                        starred: !email.starred,
                      })
                    }
                    previewUrl={getPreviewUrl(email)}
                    starred={email.starred}
                    subtitle={getEmailSubtitle(email)}
                    title={getEmailTitle(email)}
                  />
                ))
              : null}

            {activeProjectTab === "templates"
              ? seedTemplates.map((template) => (
                  <TemplateCard
                    avatarLabel="Madoo"
                    badge={template.category ?? undefined}
                    key={template.slug}
                    onClick={() => setSelectedTemplate(template)}
                    subtitle={template.description ?? "Seed template"}
                    title={template.name}
                  />
                ))
              : null}

            {activeProjectTab === "community"
              ? communityTemplates.map((template) => (
                  <TemplateCard
                    avatarLabel={template.authorName ?? template.name}
                    badge={template.category ?? undefined}
                    key={template.id}
                    onClick={() => setSelectedCommunityTemplateId(template.id)}
                    onToggleStar={() =>
                      communityStarMutation.mutate({
                        template,
                        starred: !template.starred,
                      })
                    }
                    previewUrl={template.previewUrl}
                    starred={template.starred}
                    subtitle={getCommunitySubtitle(template)}
                    title={template.name}
                  />
                ))
              : null}
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
                {emptyCopy}
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
            <span className="text-sm text-madoo-ink-muted">
              Loading preview
            </span>
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

      <ShareToCommunityModal
        email={shareTarget}
        isPending={shareMutation.isPending}
        onClose={() => {
          if (!shareMutation.isPending) setShareTarget(null);
        }}
        onSubmit={(input) => shareMutation.mutate(input)}
      />

      <CommunityTemplateUseModal
        detail={communityDetailQuery.data ?? null}
        fallback={communityPreview ?? null}
        isLoading={communityDetailQuery.isLoading}
        isPending={useCommunityMutation.isPending}
        onClose={() => {
          if (!useCommunityMutation.isPending)
            setSelectedCommunityTemplateId(null);
        }}
        onUse={(id, variableSchema) =>
          useCommunityMutation.mutate({ id, variableSchema })
        }
        open={Boolean(selectedCommunityTemplateId)}
      />
    </div>
  );
}

function EmailCardMenu({
  email,
  onShare,
}: {
  email: EmailDto;
  onShare: (email: EmailDto) => void;
}) {
  const title = getEmailTitle(email);

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          aria-label={`Open actions for ${title}`}
          className="min-h-7 min-w-7 shrink-0 rounded-md px-0!"
          size="sm"
          variant="ghost"
        >
          <Icon name="moreHorizontal" size={14} />
        </Button>
      </DropdownTrigger>
      <DropdownContent
        align="end"
        className="w-52 gap-0.5 overflow-hidden p-1!"
      >
        <DropdownItem
          className={compactMenuItemClass}
          onSelect={() => onShare(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="send" size={14} />
            Share to community
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

function ShareToCommunityModal({
  email,
  isPending,
  onClose,
  onSubmit,
}: {
  email: EmailDto | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: ShareEmailToCommunityInput) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!email) return;
    setName(getEmailTitle(email));
    setDescription("");
    setCategory("");
    setConfirming(false);
  }, [email]);

  const submit = () => {
    if (!email || !name.trim()) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSubmit({
      emailId: email.id,
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
    });
  };

  return (
    <Modal
      description={
        confirming
          ? "This will publish the template to the public community gallery."
          : "Add public gallery details before publishing."
      }
      footer={
        <>
          {confirming ? (
            <Button
              disabled={isPending}
              onClick={() => setConfirming(false)}
              size="sm"
              variant="ghost"
            >
              Back
            </Button>
          ) : (
            <Button onClick={onClose} size="sm" variant="ghost">
              Cancel
            </Button>
          )}
          <Button
            disabled={!email || !name.trim() || isPending}
            onClick={submit}
            size="sm"
            variant="primary"
          >
            {isPending
              ? "Publishing"
              : confirming
                ? "Publish publicly"
                : "Continue"}
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(email)}
      size="md"
      title={confirming ? "Confirm public publish" : "Share to community"}
    >
      {confirming ? (
        <div className="grid gap-3 text-sm leading-6 text-madoo-ink-muted">
          <p className="m-0">
            Publishing makes this email template visible to all community users.
            They can preview it, star it, and create their own email from it.
          </p>
          <p className="m-0">
            Do not publish private customer work, confidential campaign copy, or
            templates with assets you do not want others to reuse.
          </p>
          <div className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border">
            <div className="text-xs font-medium uppercase text-madoo-ink-muted">
              Template name
            </div>
            <div className="mt-1 text-sm font-medium text-madoo-ink">
              {name.trim()}
            </div>
          </div>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            label="Name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Textarea
            label="Description"
            noResize
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            value={description}
          />
          <Input
            label="Category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          />
        </form>
      )}
    </Modal>
  );
}

function CommunityTemplateUseModal({
  detail,
  fallback,
  isLoading,
  isPending,
  onClose,
  onUse,
  open,
}: {
  detail: CommunityTemplateDetailDto | null;
  fallback: CommunityTemplateDto | null;
  isLoading: boolean;
  isPending: boolean;
  onClose: () => void;
  onUse: (id: string, variableSchema: VariableSchemaRoot) => void;
  open: boolean;
}) {
  const [draft, setDraft] = useState<VariableSchemaRoot>({ variables: [] });
  const activeTemplate = detail ?? fallback;

  useEffect(() => {
    if (detail) setDraft(cloneSchema(detail.variableSchema));
  }, [detail]);

  const updateVariable = (
    name: string,
    patch: Partial<Pick<VariableSpec, "default" | "scope">>,
  ) => {
    setDraft((current) => ({
      variables: current.variables.map((variable) =>
        variable.name === name ? { ...variable, ...patch } : variable,
      ),
    }));
  };

  const useTemplate = () => {
    if (!detail) return;
    onUse(detail.id, draft);
  };

  return (
    <Modal
      footer={
        <>
          <Button onClick={onClose} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!detail || isPending}
            onClick={useTemplate}
            size="sm"
            variant="primary"
          >
            {isPending ? "Creating" : "Use template"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="xl"
      title={activeTemplate?.name ?? "Community template"}
    >
      {isLoading ? (
        <div className="grid min-h-100 place-items-center text-sm text-madoo-ink-muted">
          Loading template
        </div>
      ) : detail ? (
        <div className="grid grid-cols-[minmax(220px,320px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
          <section className="min-h-0 rounded-lg bg-white p-3 shadow-madoo-border">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-medium text-madoo-ink">
                Variables
              </h3>
              {detail.category ? (
                <span className="rounded-md bg-madoo-bg-2 px-2 py-1 text-[11px] font-medium text-madoo-ink-muted">
                  {detail.category}
                </span>
              ) : null}
            </div>
            <div className="madoo-preview-scrollbar max-h-120 space-y-3 overflow-y-auto pr-1">
              {draft.variables.length ? (
                draft.variables.map((variable) => {
                  const scope = defaultScope(variable);
                  return (
                    <div
                      className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border"
                      key={variable.name}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-madoo-ink">
                          {variable.label ?? variable.name}
                        </span>
                        {variable.role ? (
                          <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-madoo-ink-muted shadow-madoo-border">
                            {roleLabels[variable.role]}
                          </span>
                        ) : null}
                      </div>

                      {scope === "dynamic" ? (
                        <p className="mt-2 truncate rounded-lg bg-madoo-accent-soft px-2.5 py-1.5 font-madoo-mono text-xs text-madoo-accent-deep">
                          {`{{${variable.name}}}`}
                        </p>
                      ) : (
                        <Input
                          className="mt-2"
                          inputSize="sm"
                          onChange={(event) =>
                            updateVariable(variable.name, {
                              default: event.target.value,
                            })
                          }
                          placeholder="Value"
                          type={inputTypeForRole(variable.role)}
                          value={variable.default}
                        />
                      )}

                      <ScopeToggle
                        onChange={(scope) =>
                          updateVariable(variable.name, { scope })
                        }
                        value={scope}
                      />
                    </div>
                  );
                })
              ) : (
                <p className="m-0 rounded-lg bg-madoo-bg p-3 text-xs leading-5 text-madoo-ink-muted shadow-madoo-border">
                  No variables.
                </p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg bg-white shadow-madoo-border">
            <iframe
              className="h-130 w-full border-0 bg-white"
              sandbox=""
              srcDoc={detail.compiledHtml}
              title={`${detail.name} preview`}
            />
          </section>
        </div>
      ) : (
        <div className="grid min-h-80 place-items-center text-sm text-madoo-ink-muted">
          Template unavailable
        </div>
      )}
    </Modal>
  );
}

function ScopeToggle({
  onChange,
  value,
}: {
  onChange: (scope: "dynamic" | "static") => void;
  value: "dynamic" | "static";
}) {
  const scopes: Array<"dynamic" | "static"> = ["dynamic", "static"];

  return (
    <div className="mt-2 flex gap-1 rounded-lg bg-madoo-bg-2 p-1">
      {scopes.map((scope) => (
        <button
          aria-pressed={value === scope}
          className={cx(
            "flex-1 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors",
            value === scope
              ? "bg-white text-madoo-ink shadow-madoo-border"
              : "text-madoo-ink-muted hover:text-madoo-ink",
          )}
          key={scope}
          onClick={() => onChange(scope)}
          type="button"
        >
          {scope}
        </button>
      ))}
    </div>
  );
}
