"use client";

import { fetchEmails, setEmailStarred } from "@/actions/emails";
import {
  fetchCommunityTemplate,
  fetchCommunityTemplates,
  makeCommunityTemplatePrivate,
  setCommunityTemplateStarred,
  shareEmailToCommunity,
  useCommunityTemplate,
  type CommunityTemplateDto,
} from "@/actions/community-templates";
import { MasonryGrid } from "@/components/global/masonry-grid";
import TemplateCard from "@/components/global/template-card";
import { TestingModal } from "@/components/project/testing/TestingModal";
import { useAuthStore } from "@/stores/auth-store";
import { Button, Card, Icon, SegmentedControl, useToast } from "@madoo/design-system";
import {
  COMMUNITY_TEMPLATE_CATEGORIES,
  type EmailDto,
  type CommunityTemplateCategory,
  type VariableSchemaRoot,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  CommunityTemplateUseModal,
  ShareToCommunityModal,
} from "./CommunityTemplateUseModal";
import { MakePrivateModal } from "./MakePrivateModal";
import {
  CommunityCardMenu,
  CommunityCategoryFilterChips,
  EmailCardMenu,
} from "./show-case-menus";
import {
  CommunityCategoryFilter,
  getCommunitySubtitle,
  getEmailSubtitle,
  getEmailTitle,
  getErrorMessage,
  getPreviewUrl,
  getTemplateMasonryWeight,
} from "./show-case-utils";

type ProjectTab = "projects" | "community";

const projectTabs = [
  { value: "projects", label: "My templates" },
  { value: "community", label: "Community" },
];
export { ShareToCommunityModal } from "./CommunityTemplateUseModal";

export function ProjectShowCase() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("projects");
  const [projectTabTouched, setProjectTabTouched] = useState(false);
  const [shareTarget, setShareTarget] = useState<EmailDto | null>(null);
  const [testTarget, setTestTarget] = useState<EmailDto | null>(null);
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
      [...emails].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
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
          <div className="grid min-h-60 place-items-center rounded-lg bg-white text-sm text-madoo-ink-muted">
            Loading...
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
                        onTest={(nextEmail) => setTestTarget(nextEmail)}
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

      <TestingModal
        emailId={testTarget?.id ?? null}
        html={
          testTarget?.variants[testTarget.variants.length - 1]?.compiledHtml ??
          ""
        }
        onClose={() => setTestTarget(null)}
        open={Boolean(testTarget)}
        variantId={
          testTarget?.variants[testTarget.variants.length - 1]?.id ?? null
        }
      />

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
