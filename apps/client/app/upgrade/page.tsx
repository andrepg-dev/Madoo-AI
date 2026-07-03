"use client";

import { createCheckoutSession } from "@/actions/billing";
import { Button, Card, Icon } from "@madoo/design-system";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const PLANS = ["BASIC", "MEDIUM", "PRO"] as const;
type CheckoutPlan = (typeof PLANS)[number];

const INTERVALS = ["MONTHLY", "ANNUAL"] as const;
type CheckoutInterval = (typeof INTERVALS)[number];

function parsePlan(value: string | null): CheckoutPlan | null {
  return PLANS.includes(value as CheckoutPlan) ? (value as CheckoutPlan) : null;
}

function parseInterval(value: string | null): CheckoutInterval {
  return INTERVALS.includes(value as CheckoutInterval)
    ? (value as CheckoutInterval)
    : "MONTHLY";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function UpgradeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = parsePlan(searchParams.get("plan"));
  const interval = parseInterval(searchParams.get("interval"));
  const startedRef = useRef(false);

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckoutSession({ plan: plan!, interval }),
    onSuccess: (session) => {
      window.location.assign(session.url);
    },
  });

  // Start checkout exactly once. The middleware already guarantees the visitor
  // is authenticated by the time this page renders, so there is no login step —
  // this route only exists to hand a signed-in visitor from the marketing
  // pricing page straight to Stripe with their chosen plan preselected.
  const { mutate } = checkoutMutation;
  useEffect(() => {
    if (!plan || startedRef.current) return;
    startedRef.current = true;
    mutate();
  }, [mutate, plan]);

  const error = checkoutMutation.error;

  return (
    <main className="grid min-h-screen place-items-center bg-(--madoo-page) px-4 py-10 font-madoo-sans text-madoo-ink">
      <Card className="grid w-full max-w-md gap-5 rounded-[20px]! bg-madoo-surface! p-6!">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-bg-2 shadow-madoo-border">
            <Icon name="sparkle" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold leading-none">
              {error ? "Could not start checkout" : "Redirecting to checkout…"}
            </h1>
            <p className="mt-1 text-(length:--font-size-sm) text-madoo-ink-muted">
              {error
                ? "Something went wrong setting this up."
                : "Taking you to secure payment."}
            </p>
          </div>
        </div>

        {!plan ? (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            No plan was specified.
          </p>
        ) : error ? (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            {getErrorMessage(error, "Try again from pricing.")}
          </p>
        ) : (
          <p className="text-(length:--font-size-base) text-madoo-ink-muted">
            Hold on, this only takes a moment.
          </p>
        )}

        {error || !plan ? (
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

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeInner />
    </Suspense>
  );
}
