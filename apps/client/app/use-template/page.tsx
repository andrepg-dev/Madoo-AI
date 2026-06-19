"use client";

import {
  fetchCommunityTemplate,
  useCommunityTemplate,
} from "@/actions/community-templates";
import { Button, Card, Icon } from "@madoo/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function UseTemplateInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const startedRef = useRef(false);

  const templateQuery = useQuery({
    queryKey: ["community-template", id],
    queryFn: () => fetchCommunityTemplate(id!),
    enabled: Boolean(id),
    retry: false,
  });

  const useTemplateMutation = useMutation({
    mutationFn: () =>
      useCommunityTemplate(id!, templateQuery.data!.variableSchema),
    onSuccess: async (email) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
        queryClient.invalidateQueries({ queryKey: ["community-templates"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      ]);
      router.replace(
        `/email-template-project?id=${encodeURIComponent(email.id)}`,
      );
    },
  });

  // Kick off the "use" exactly once the template detail is available. The
  // middleware already guarantees the visitor is authenticated by the time this
  // page renders, so there is no login step here.
  const { mutate } = useTemplateMutation;
  const ready = templateQuery.isSuccess;
  useEffect(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    mutate();
  }, [mutate, ready]);

  const error = templateQuery.error ?? useTemplateMutation.error;

  return (
    <main className="grid min-h-screen place-items-center bg-(--madoo-page) px-4 py-10 font-madoo-sans text-madoo-ink">
      <Card className="grid w-full max-w-md gap-5 rounded-[20px]! bg-madoo-surface! p-6!">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-bg-2 shadow-madoo-border">
            <Icon name="image" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold leading-none">
              {error ? "Could not open template" : "Opening template…"}
            </h1>
            <p className="mt-1 text-(length:--font-size-sm) text-madoo-ink-muted">
              {error
                ? "Something went wrong setting this up."
                : "Creating your email from this template."}
            </p>
          </div>
        </div>

        {!id ? (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            No template was specified.
          </p>
        ) : error ? (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            {getErrorMessage(error, "Try again from the gallery.")}
          </p>
        ) : (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            Hold on, this only takes a moment.
          </p>
        )}

        {error || !id ? (
          <Button
            onClick={() => router.push("/dashboard/projects")}
            size="sm"
            variant="primary"
          >
            Go to my emails
          </Button>
        ) : null}
      </Card>
    </main>
  );
}

export default function UseTemplatePage() {
  return (
    <Suspense fallback={null}>
      <UseTemplateInner />
    </Suspense>
  );
}
