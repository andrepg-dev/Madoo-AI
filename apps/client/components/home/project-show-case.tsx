"use client";

import { fetchEmails, setEmailStarred } from "@/actions/emails";
import {
  fetchCommunityTemplate,
  fetchCommunityTemplates,
  makeCommunityTemplatePrivate,
  setCommunityTemplateStarred,
  shareEmailToCommunity,
  useCommunityTemplate,
  type CommunityTemplateDetailDto,
  type CommunityTemplateDto,
  type ShareEmailToCommunityInput,
} from "@/actions/community-templates";
import EmailPreviewFrame from "@/components/global/email-preview-frame";
import { MasonryGrid } from "@/components/global/masonry-grid";
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
  COMMUNITY_TEMPLATE_CATEGORIES,
  COMMUNITY_TEMPLATE_MAX_CATEGORIES,
  type EmailDto,
  type CommunityTemplateCategory,
  type VariableSchemaRoot,
  type VariableSpec,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProjectTab = "projects" | "community";

const projectTabs = [
  { value: "projects", label: "My templates" },
  { value: "community", label: "Community" },
];

const compactMenuItemClass = "justify-start! px-2! py-1.5! text-[13px]!";
const templateMasonryWeights = [1.25, 1.4, 1.33, 1.43, 1.5] as const;
type CommunityCategoryFilter = "all" | CommunityTemplateCategory;

const categorySuggestionRules: Array<{
  category: CommunityTemplateCategory;
  pattern: RegExp;
}> = [
  {
    category: "Abandoned Cart",
    pattern: /\b(abandoned\s+cart|cart\s+recovery)\b/i,
  },
  {
    category: "Events & Webinars",
    pattern: /\b(event|webinar|conference|workshop|invite|invitation)\b/i,
  },
  {
    category: "Seasonal / Holiday",
    pattern:
      /\b(holiday|christmas|black\s+friday|cyber\s+monday|thanksgiving|new\s+year|valentine|halloween|seasonal)\b/i,
  },
  {
    category: "Product Launch",
    pattern: /\b(launch|new\s+product|release|waitlist)\b/i,
  },
  {
    category: "Survey & Feedback",
    pattern: /\b(survey|feedback|review|rating|nps)\b/i,
  },
  {
    category: "Re-engagement",
    pattern: /\b(re-engage|reengage|winback|inactive|miss\s+you|come\s+back)\b/i,
  },
  {
    category: "Transactional",
    pattern:
      /\b(receipt|invoice|password|reset|account|security|shipping|delivery|order)\b/i,
  },
  {
    category: "Confirmation",
    pattern: /\b(confirm|confirmation|rsvp|booking|reservation)\b/i,
  },
  {
    category: "Promotional",
    pattern: /\b(sale|discount|promo|coupon|offer|deal)\b/i,
  },
  {
    category: "Newsletter",
    pattern: /\b(newsletter|digest|roundup|weekly|monthly)\b/i,
  },
  {
    category: "Welcome",
    pattern: /\b(welcome|onboard|onboarding|get\s+started)\b/i,
  },
  {
    category: "Announcement",
    pattern: /\b(announce|announcement|update|news|feature)\b/i,
  },
  {
    category: "Referral",
    pattern: /\b(referral|refer|invite\s+(a\s+)?friend)\b/i,
  },
  {
    category: "Internal / HR",
    pattern: /\b(hiring|hr|employee|team|internal|policy)\b/i,
  },
  {
    category: "Education / Tutorial",
    pattern: /\b(tutorial|lesson|course|guide|learn|education)\b/i,
  },
  {
    category: "Thank You",
    pattern: /\b(thank\s+you|thanks|appreciation)\b/i,
  },
];

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
  return template.authorName || template.categories[0] || "Community";
}

function getPreviewUrl(email: EmailDto): string | null {
  return email.variants[email.variants.length - 1]?.previewUrl ?? null;
}

function getTemplateMasonryWeight(_item: unknown, index: number): number {
  return templateMasonryWeights[index % templateMasonryWeights.length];
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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

function suggestCommunityCategories(
  email: EmailDto,
): CommunityTemplateCategory[] {
  const latestVariant = email.variants[email.variants.length - 1];
  const text = [
    getEmailTitle(email),
    email.prompt,
    email.audience,
    latestVariant?.subject,
  ]
    .filter(Boolean)
    .join(" ");
  const suggestions: CommunityTemplateCategory[] = [];
  for (const rule of categorySuggestionRules) {
    if (rule.pattern.test(text) && !suggestions.includes(rule.category)) {
      suggestions.push(rule.category);
      if (suggestions.length === COMMUNITY_TEMPLATE_MAX_CATEGORIES) break;
    }
  }
  return suggestions;
}

function toggleCategorySelection(
  current: CommunityTemplateCategory[],
  category: CommunityTemplateCategory,
): CommunityTemplateCategory[] {
  if (current.includes(category)) {
    return current.filter((item) => item !== category);
  }
  if (current.length >= COMMUNITY_TEMPLATE_MAX_CATEGORIES) return current;
  return [...current, category];
}

export function ProjectShowCase() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("projects");
  const [projectTabTouched, setProjectTabTouched] = useState(false);
  const [shareTarget, setShareTarget] = useState<EmailDto | null>(null);
  const [privateTarget, setPrivateTarget] =
    useState<CommunityTemplateDto | null>(null);
  const [selectedCommunityTemplateId, setSelectedCommunityTemplateId] =
    useState<string | null>(null);
  const [communityCategoryFilter, setCommunityCategoryFilter] =
    useState<CommunityCategoryFilter>("all");

  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
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

  const communityCategoryCounts = useMemo(() => {
    const counts = new Map<CommunityTemplateCategory, number>();
    for (const template of communityTemplates) {
      for (const category of template.categories) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return counts;
  }, [communityTemplates]);

  const communityCategoryOptions = useMemo(
    () =>
      COMMUNITY_TEMPLATE_CATEGORIES.filter((category) =>
        communityCategoryCounts.has(category),
      ),
    [communityCategoryCounts],
  );

  const filteredCommunityTemplates = useMemo(() => {
    if (communityCategoryFilter === "all") return communityTemplates;
    return communityTemplates.filter((template) =>
      template.categories.includes(communityCategoryFilter),
    );
  }, [communityCategoryFilter, communityTemplates]);

  const communityDetailQuery = useQuery({
    queryKey: ["community-template", selectedCommunityTemplateId],
    queryFn: () => fetchCommunityTemplate(selectedCommunityTemplateId!),
    enabled: Boolean(selectedCommunityTemplateId),
  });

  useEffect(() => {
    if (!user || projectTabTouched || emailsLoading) return;

    setActiveProjectTab(recentEmails.length > 0 ? "projects" : "community");
  }, [emailsLoading, projectTabTouched, recentEmails.length, user]);

  useEffect(() => {
    if (
      communityCategoryFilter !== "all" &&
      !communityCategoryCounts.has(communityCategoryFilter)
    ) {
      setCommunityCategoryFilter("all");
    }
  }, [communityCategoryCounts, communityCategoryFilter]);

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

  const makePrivateMutation = useMutation({
    mutationFn: (template: CommunityTemplateDto) =>
      makeCommunityTemplatePrivate(template.id),
    onSuccess: async () => {
      setPrivateTarget(null);
      await queryClient.invalidateQueries({
        queryKey: ["community-templates"],
      });
      toast({ tone: "success", title: "Template made private" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not make private",
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
    activeProjectTab === "projects" ? emailsLoading : communityTemplatesLoading;

  const activeCount =
    activeProjectTab === "projects"
      ? recentEmails.length
      : filteredCommunityTemplates.length;

  const emptyCopy =
    activeProjectTab === "projects"
      ? "No emails yet"
      : communityCategoryFilter === "all"
        ? "No community templates yet"
        : "No templates in this category";

  return (
    <div className="relative z-10 w-full px-0 sm:px-6 py-6">
      <Card
        aria-label="Project gallery"
        className="w-full overflow-hidden rounded-lg! bg-madoo-accent-fg! p-6 pb-9 shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.14)]!"
      >
        <div className="mb-4 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <SegmentedControl
            aria-label="Project view"
            items={projectTabs}
            onChange={(value) => {
              setProjectTabTouched(true);
              setActiveProjectTab(value as ProjectTab);
            }}
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

        {activeProjectTab === "community" && communityCategoryOptions.length ? (
          <CommunityCategoryFilterChips
            active={communityCategoryFilter}
            counts={communityCategoryCounts}
            onChange={setCommunityCategoryFilter}
            options={communityCategoryOptions}
            total={communityTemplates.length}
          />
        ) : null}

        {loading ? (
          <div className="grid min-h-60 place-items-center rounded-lg bg-white text-sm text-madoo-ink-muted shadow-madoo-border">
            Loading
          </div>
        ) : activeCount ? (
          <>
            {activeProjectTab === "projects" ? (
              <MasonryGrid
                getWeight={getTemplateMasonryWeight}
                items={recentEmails}
                renderItem={(email, index) => (
                  <TemplateCard
                    badge={email.status === "ERROR" ? "Error" : undefined}
                    key={email.id}
                    masonryIndex={index}
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
                )}
              />
            ) : null}

            {activeProjectTab === "community" ? (
              <MasonryGrid
                getWeight={getTemplateMasonryWeight}
                items={filteredCommunityTemplates}
                renderItem={(template, index) => (
                  <TemplateCard
                    badge={
                      template.categories[0] ?? template.category ?? undefined
                    }
                    key={template.id}
                    masonryIndex={index}
                    menu={
                      template.owned ? (
                        <CommunityCardMenu
                          onMakePrivate={() => setPrivateTarget(template)}
                          title={template.name}
                        />
                      ) : undefined
                    }
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
                )}
              />
            ) : null}
          </>
        ) : (
          <div
            className="grid min-h-90 place-items-center rounded-lg bg-white p-6 text-center"
            style={{
              background: "#ffffff",
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          >
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
                {user ? "New items will appear here." : "Loading workspace."}
              </p>
            </div>
          </div>
        )}
      </Card>

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

      <MakePrivateModal
        isPending={makePrivateMutation.isPending}
        onClose={() => {
          if (!makePrivateMutation.isPending) setPrivateTarget(null);
        }}
        onConfirm={() =>
          privateTarget ? makePrivateMutation.mutate(privateTarget) : undefined
        }
        template={privateTarget}
      />
    </div>
  );
}

function CommunityCategoryFilterChips({
  active,
  counts,
  onChange,
  options,
  total,
}: {
  active: CommunityCategoryFilter;
  counts: Map<CommunityTemplateCategory, number>;
  onChange: (category: CommunityCategoryFilter) => void;
  options: CommunityTemplateCategory[];
  total: number;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <button
        aria-pressed={active === "all"}
        className={cx(
          "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
          active === "all"
            ? "bg-madoo-ink text-white"
            : "bg-white text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
        )}
        onClick={() => onChange("all")}
        type="button"
      >
        All {total}
      </button>
      {options.map((category) => (
        <button
          aria-pressed={active === category}
          className={cx(
            "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
            active === category
              ? "bg-madoo-ink text-white"
              : "bg-white text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
          )}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category} {counts.get(category) ?? 0}
        </button>
      ))}
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

function CommunityCardMenu({
  onMakePrivate,
  title,
}: {
  onMakePrivate: () => void;
  title: string;
}) {
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
        <DropdownItem className={compactMenuItemClass} onSelect={onMakePrivate}>
          <span className="flex items-center gap-2.5">
            <Icon name="lock" size={14} />
            Make private
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

function MakePrivateModal({
  isPending,
  onClose,
  onConfirm,
  template,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  template: CommunityTemplateDto | null;
}) {
  return (
    <Modal
      footer={
        <>
          <Button
            disabled={isPending}
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            size="sm"
            variant="primary"
          >
            {isPending ? "Making private" : "Make private"}
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(template)}
      size="sm"
      title="Make template private"
    >
      <p className="m-0 text-sm leading-6 text-madoo-ink-muted">
        This removes{" "}
        <span className="font-medium text-madoo-ink">{template?.name}</span>{" "}
        from the public community gallery. Others will no longer be able to
        find, star, or use it, and its stars will be lost. Your original email
        stays in your workspace, and you can share it again later.
      </p>
    </Modal>
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
  const [selectedCategories, setSelectedCategories] = useState<
    CommunityTemplateCategory[]
  >([]);
  const [suggestedCategories, setSuggestedCategories] = useState<
    CommunityTemplateCategory[]
  >([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!email) return;
    const suggestions = suggestCommunityCategories(email);
    setName(getEmailTitle(email));
    setDescription("");
    setSelectedCategories(suggestions);
    setSuggestedCategories(suggestions);
    setConfirming(false);
  }, [email]);

  const submit = () => {
    if (!email || !name.trim() || selectedCategories.length === 0) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSubmit({
      emailId: email.id,
      name: name.trim(),
      description: description.trim() || null,
      category: selectedCategories[0] ?? null,
      categories: selectedCategories,
    });
  };

  const categoryLimitReached =
    selectedCategories.length >= COMMUNITY_TEMPLATE_MAX_CATEGORIES;

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
            disabled={
              !email ||
              !name.trim() ||
              selectedCategories.length === 0 ||
              isPending
            }
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
          <div className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border">
            <div className="text-xs font-medium uppercase text-madoo-ink-muted">
              Categories
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedCategories.map((category) => (
                <span
                  className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-madoo-ink shadow-madoo-border"
                  key={category}
                >
                  {category}
                </span>
              ))}
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
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-madoo-ink">
                Categories
              </span>
              <span className="text-[12px] text-madoo-ink-muted">
                Choose up to {COMMUNITY_TEMPLATE_MAX_CATEGORIES}
              </span>
            </div>
            {suggestedCategories.length ? (
              <div className="rounded-lg bg-madoo-accent-soft p-3">
                <p className="m-0 mb-2 text-[12px] font-medium text-madoo-accent-deep">
                  Suggested for this template
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedCategories.map((category) => (
                    <button
                      aria-pressed={selectedCategories.includes(category)}
                      className={cx(
                        "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
                        selectedCategories.includes(category)
                          ? "bg-madoo-ink text-white"
                          : "bg-white text-madoo-accent-deep shadow-madoo-border",
                      )}
                      key={category}
                      onClick={() =>
                        setSelectedCategories((current) =>
                          toggleCategorySelection(current, category),
                        )
                      }
                      type="button"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {COMMUNITY_TEMPLATE_CATEGORIES.map((category) => {
                const selected = selectedCategories.includes(category);
                const disabled = !selected && categoryLimitReached;
                return (
                  <button
                    aria-pressed={selected}
                    className={cx(
                      "h-8 rounded-full border-0 px-3 text-[12px] font-medium transition",
                      selected
                        ? "cursor-pointer bg-madoo-ink text-white"
                        : disabled
                          ? "cursor-not-allowed bg-madoo-bg-2 text-madoo-ink-muted/55"
                          : "cursor-pointer bg-madoo-bg-2 text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
                    )}
                    disabled={disabled}
                    key={category}
                    onClick={() =>
                      setSelectedCategories((current) =>
                        toggleCategorySelection(current, category),
                      )
                    }
                    type="button"
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
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
      size="xxl"
      title={activeTemplate?.name ?? "Community template"}
    >
      {isLoading ? (
        <div className="grid min-h-100 place-items-center text-sm text-madoo-ink-muted">
          Loading template
        </div>
      ) : detail ? (
        <div className="grid grid-cols-[minmax(220px,300px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
          <section className="min-h-0 rounded-lg bg-white p-3 shadow-madoo-border">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-medium text-madoo-ink">
                Variables
              </h3>
            </div>
            {detail.categories.length ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {detail.categories.map((category) => (
                  <span
                    className="rounded-md bg-madoo-bg-2 px-2 py-1 text-[11px] font-medium text-madoo-ink-muted"
                    key={category}
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="madoo-preview-scrollbar max-h-[78vh] space-y-3 overflow-y-auto pr-1">
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
            <EmailPreviewFrame
              className="h-[78vh] min-h-130"
              html={detail.compiledHtml}
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
