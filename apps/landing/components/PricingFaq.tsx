"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { REFERRAL_REWARD_CREDITS } from "@madoo/shared";
import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Faq = {
  question: string;
  answer: string;
  /** Renders the 7-day trial email-claim form under the answer. */
  claimTrial?: boolean;
};

const faqs: Faq[] = [
  {
    question: "What's Madoo AI and how does it work?",
    answer:
      "Madoo is an AI email template design company. It's built for marketers and agencies that don't want to keep using drag-and-drop tools and want to create professional email templates with professional specialized AI tools.",
  },
  {
    question: "Can I change my plan, and is there a free trial?",
    answer:
      "Yes. You can change your plan at any time. To get a 7-day free trial, reserve it with the same email you'll use to sign up, then choose a plan after logging in. Without a reserved trial, checkout charges immediately.",
    claimTrial: true,
  },
  {
    question: "How does the referral program work?",
    answer: `Share your referral link from Settings → Refer & earn. You earn ${REFERRAL_REWARD_CREDITS} credits each time someone you invite subscribes to a paid plan. Inviting people who stay on the free plan — or who only start a trial — doesn't earn credits; the reward lands once they're actually charged.`,
  },
  {
    question: "How do credits work?",
    answer:
      "1 AI message costs 1 credit. Creating a template from scratch costs 1 credit, and each message you send to edit that template also costs 1 credit.",
  },
  {
    question: "Who owns the project and code?",
    answer:
      "You completely own the AI-generated code. You can use it wherever you need, in any project or workflow.",
  },
  {
    question: "What if I don't find my export provider?",
    answer:
      "If you don't find your provider, you can report it inside the platform with the add provider button.",
  },
];

function TrialClaimForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/trial-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const raw = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(raw?.message ?? "Could not reserve your trial.");
      }
      setStatus("done");
      setMessage("Spot reserved! Sign up with this email to start your trial.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Could not reserve your trial.",
      );
    }
  };

  if (status === "done") {
    return (
      <p className="mt-3 rounded-2xl bg-madoo-blue-50 px-4 py-3 text-sm font-medium text-madoo-blue-700">
        {message}
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") setStatus("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          className="h-11 flex-1 rounded-full border-0 bg-madoo-neutral-50 px-4 text-sm text-madoo-text shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.28)] outline-none placeholder:text-madoo-muted focus:shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.5)]"
        />
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void submit()}
          className="h-11 cursor-pointer rounded-full bg-madoo-text px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? "Reserving…" : "Reserve my trial"}
        </button>
      </div>
      {status === "error" && message ? (
        <p className="mt-2 text-sm text-red-600">{message}</p>
      ) : null}
    </div>
  );
}

export function PricingFaq() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-24 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold leading-none text-madoo-text">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-base leading-7 text-madoo-muted">
          Answers based on our platform and how the process works.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-3xl gap-3">
        {faqs.map((faq, index) => (
          <details
            key={faq.question}
            id={faq.claimTrial ? "free-trial" : undefined}
            open={index === 1}
            className="madoo-paper-border group scroll-mt-24 rounded-[28px] bg-madoo-paper px-6 py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-madoo-text [&::-webkit-details-marker]:hidden">
              {faq.question}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                strokeWidth={2.2}
                className="shrink-0 text-madoo-muted transition group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-madoo-muted">
              {faq.answer}
            </p>
            {faq.claimTrial ? <TrialClaimForm /> : null}
          </details>
        ))}
      </div>
    </section>
  );
}
