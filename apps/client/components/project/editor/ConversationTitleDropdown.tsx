import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Card, Dropdown, DropdownContent, DropdownDivider, DropdownItem, DropdownTrigger, ProgressBar, useToast } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, HelpCircleIcon, Plug01Icon, Settings01Icon, StarIcon } from "@hugeicons/core-free-icons";
import type { EmailDto } from "@madoo/shared";
import { fetchBillingOverview } from "@/actions/billing";
import { setEmailStarred } from "@/actions/emails";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import { formatCreditReset } from "./utils";
import { HeaderMenuIcon } from "./HeaderMenuIcon";

export function ConversationTitleDropdown({
  title,
  emailId,
  starred,
}: {
  title: string;
  emailId: string | null;
  starred: boolean;
}) {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const workspaceId = useClientStore((state) => state.workspaceId);
  const queryClient = useQueryClient();

  const starMutation = useMutation({
    mutationFn: (next: boolean) => setEmailStarred(emailId!, next),
    onSuccess: (updated) => {
      queryClient.setQueryData(["email", updated.id], updated);
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ??
        current,
      );
      toast({
        tone: "success",
        title: updated.starred ? "Project starred" : "Project unstarred",
      });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not update star",
        body: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  const { data: billingOverview, isLoading: billingLoading } = useQuery({
    queryKey: ["billing-overview", workspaceId],
    queryFn: fetchBillingOverview,
    enabled: Boolean(user && workspaceId),
  });

  const usage = billingOverview?.usage.dailyAiGenerations;
  const usageLimit = usage?.limit ?? 0;
  const creditsLeft =
    usageLimit === -1 ? null : Math.max(usageLimit - (usage?.used ?? 0), 0);
  const creditsPct =
    usageLimit === -1
      ? 100
      : usageLimit > 0 && creditsLeft !== null
        ? Math.min(100, Math.round((creditsLeft / usageLimit) * 100))
        : 0;
  const creditsText = billingLoading
    ? "Loading"
    : usageLimit === -1
      ? "Unlimited"
      : `${creditsLeft ?? 0} left`;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          className="h-8 max-w-[min(360px,calc(100vw-32px))] gap-1.5 px-2.5 py-0! text-[13px] shadow-none! hover:shadow-none! data-[state=open]:shadow-none!"
          variant="ghost"
        >
          <Image
            src={"/madoo-transparent.png"}
            alt="Madoo AI Logo"
            width={20}
            height={20}
          />
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{title}</span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowDown01Icon}
              primaryColor="currentColor"
              className="size-4 shrink-0 text-madoo-ink-muted"
            />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownContent
        align="start"
        className="w-72 gap-1 overflow-hidden p-1.5!"
      >
        <DropdownItem
          asChild
          className="justify-start! px-2! py-1.5! text-[13px]!"
        >
          <Link href="/dashboard/projects">
            <span className="flex items-center gap-2.5">
              <HeaderMenuIcon icon={ArrowLeft01Icon} />
              Back to dashboard
            </span>
          </Link>
        </DropdownItem>
        <DropdownDivider />

        <DropdownItem asChild className="justify-start! gap-2 px-2! py-1.5!">
          <Link href="/settings/profile">
            <Avatar
              name={user?.name ?? user?.email ?? "User"}
              src={user?.avatarUrl ?? undefined}
              size="sm"
            />
            <span className="grid min-w-0 flex-1 gap-0.5 text-left">
              <span className="truncate font-medium">
                {user?.name ?? "User profile"}
              </span>
              <span className="truncate text-xs text-madoo-ink-muted">
                {user?.email ?? "Manage your profile"}
              </span>
            </span>
          </Link>
        </DropdownItem>

        <Card surface="secondary" className="grid gap-1.5 p-2!">
          <div className="flex items-center justify-between gap-2">
            <span className="text-(length:--font-size-base) font-normal">
              Daily credits
            </span>
            <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
              {creditsText}
            </span>
          </div>
          <ProgressBar value={creditsPct} tone="ink" label="Daily credits left" />
          <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
            Resets {formatCreditReset(usage?.resetsAt)}
          </span>
        </Card>

        <DropdownDivider />

        <DropdownItem
          asChild
          className="justify-start! px-2! py-1! text-[13px]!"
        >
          <Link href="/settings/general">
            <span className="flex items-center gap-2.5">
              <HeaderMenuIcon icon={Settings01Icon} />
              Settings
            </span>
          </Link>
        </DropdownItem>
        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          onSelect={() =>
            toast({ tone: "default", title: "Providers coming soon" })
          }
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={Plug01Icon} />
            Providers
          </span>
        </DropdownItem>
        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          disabled={!emailId || starMutation.isPending}
          onSelect={() => {
            if (!emailId) return;
            starMutation.mutate(!starred);
          }}
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={StarIcon} />
            {starred ? "Unstar project" : "Star project"}
          </span>
        </DropdownItem>
        <DropdownItem
          asChild
          className="justify-start! px-2! py-1! text-[13px]!"
        >
          <Link href="/settings/support">
            <span className="flex items-center gap-2.5">
              <HeaderMenuIcon icon={HelpCircleIcon} />
              Help
            </span>
          </Link>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
