"use client";

import { getMeOrNull } from "@/actions/auth";
import { acceptInvite, fetchInvitePreview } from "@/actions/invites";
import { buildLandingAuthUrl } from "@/lib/auth-redirect";
import { useClientStore } from "@/stores/client-store";
import { Avatar, Button, Card, Icon, useToast } from "@madoo/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);

  const previewQuery = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => fetchInvitePreview(token),
    enabled: Boolean(token),
    retry: false,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMeOrNull(),
    staleTime: 60_000,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: async (result) => {
      setWorkspaceId(result.workspace.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      ]);
      router.push("/dashboard/projects");
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Invite accept failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const preview = previewQuery.data;
  const user = meQuery.data;

  return (
    <main className="grid min-h-screen place-items-center bg-(--madoo-page) px-4 py-10 font-madoo-sans text-madoo-ink">
      <Card className="grid w-full max-w-lg gap-5 rounded-[20px]! bg-madoo-surface! p-6!">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-bg-2 shadow-madoo-border">
            <Icon name="copy" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold leading-none">
              Workspace invite
            </h1>
            <p className="mt-1 text-(length:--font-size-sm) text-madoo-ink-muted">
              Join workspace in Madoo.
            </p>
          </div>
        </div>

        {previewQuery.isLoading ? (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            Loading invite...
          </p>
        ) : previewQuery.isError || !preview ? (
          <div className="grid gap-3">
            <p className="text-(length:--font-size-base) text-madoo-ink-muted">
              Invite is invalid, expired, or already accepted.
            </p>
            <Link
              href="/"
              className="inline-flex w-max items-center rounded-lg bg-madoo-surface px-3.5 py-2 font-madoo-sans text-[13.5px] font-medium leading-none text-madoo-ink no-underline shadow-madoo-border"
            >
              Go home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-madoo-bg-2 p-4 shadow-madoo-border">
              <Avatar
                name={preview.workspace.name}
                src={preview.workspace.avatarUrl ?? undefined}
                size="lg"
                tone="accent"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold leading-none">
                  {preview.workspace.name}
                </p>
                <p className="mt-1 text-(length:--font-size-sm) text-madoo-ink-muted">
                  Invited by {preview.inviter.name ?? preview.inviter.email}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-(length:--font-size-sm) text-madoo-ink-muted">
              <p>Role: {preview.role}</p>
              <p>Expires: {formatDate(preview.expiresAt)}</p>
              {preview.email ? <p>For: {preview.email}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="md"
                disabled={acceptMutation.isPending || meQuery.isLoading}
                onClick={() => {
                  if (!user) {
                    window.location.assign(
                      buildLandingAuthUrl(`/invite/${encodeURIComponent(token)}`),
                    );
                    return;
                  }
                  acceptMutation.mutate(token);
                }}
              >
                {user ? "Accept invite" : "Sign in to accept"}
              </Button>
              <Link
                href="/"
                className="inline-flex items-center rounded-lg bg-madoo-surface px-3.5 py-2 font-madoo-sans text-[13.5px] font-medium leading-none text-madoo-ink no-underline shadow-madoo-border"
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
