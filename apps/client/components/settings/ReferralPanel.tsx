"use client";

import { fetchMyReferral } from "@/actions/referrals";
import { Button, Card, Icon, useToast } from "@madoo/design-system";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function PanelCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[20px]! p-5!">
      <div className="mb-4">
        <h2 className="text-lg font-semibold leading-none text-madoo-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1 rounded-xl bg-madoo-bg-2 p-4 shadow-madoo-border">
      <span className="text-2xl font-semibold leading-none text-madoo-ink">
        {new Intl.NumberFormat().format(value)}
      </span>
      <span className="text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
        {label}
      </span>
    </div>
  );
}

export function ReferralPanel() {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-referral"],
    queryFn: fetchMyReferral,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <PanelCard title="Refer & earn">
        <p className="text-(length:--font-size-base) text-madoo-ink-muted">
          Loading your referral link…
        </p>
      </PanelCard>
    );
  }

  if (isError || !data) {
    return (
      <PanelCard title="Refer & earn">
        <p className="text-(length:--font-size-base) text-madoo-ink-muted">
          {getErrorMessage(error, "Couldn't load your referral link.")}
        </p>
      </PanelCard>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      toast({ tone: "success", title: "Referral link copied" });
    } catch {
      toast({ tone: "danger", title: "Couldn't copy link" });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px] shadow-madoo-border">
        <Image
          src="/referral-banner.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
        <div className="relative z-10 grid gap-4 p-5">
          <div className="inline-flex w-max items-baseline gap-1.5 rounded-full bg-white/20 px-4 py-2 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.4)] backdrop-blur-sm absolute top-5 right-5">
            <span className="text-2xl font-semibold leading-none text-white">
              {new Intl.NumberFormat().format(data.creditsEarned)}
            </span>
            <span className="text-(length:--font-size-sm) leading-none text-white/85">
              credits
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-none text-white">
              Rewards you&apos;ve won
            </h2>
            <p className="mt-2 max-w-sm text-(length:--font-size-sm) leading-5 text-white/75">
              How much you&apos;ve earned by referring Madoo to your friends.
            </p>
          </div>
          <div className="inline-flex w-max max-w-full items-center gap-3 rounded-lg bg-white/95 p-2 pl-3.5 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.4)] backdrop-blur-sm">
            <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-madoo-ink-muted">
              {data.url}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void copyLink()}
            >
              Copy link
            </Button>
          </div>
        </div>
      </div>

      <PanelCard
        title="Share Madoo"
        description="Share your link with marketers and agencies. You earn credits when an invitee subscribes to a paid plan."
      >
        <div
          className="flex items-start gap-2.5 rounded-lg bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] p-3.5 shadow-madoo-border"
          role="note"
        >
          <span className="mt-0.5 text-madoo-accent-deep" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>
          <p className="text-(length:--font-size-sm) leading-snug text-madoo-ink">
            You earn{" "}
            <strong>
              {new Intl.NumberFormat().format(data.rewardPerReferral)} credits
            </strong>{" "}
            only when someone you invite subscribes to a paid plan. Inviting
            people who stay on the free plan doesn&apos;t earn credits.
          </p>
        </div>
      </PanelCard>

      <PanelCard title="Your referrals">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Signed up" value={data.invitedCount} />
          <StatTile label="Paid (qualified)" value={data.qualifiedCount} />
          <StatTile label="Credits earned" value={data.creditsEarned} />
        </div>
      </PanelCard>
    </div>
  );
}
