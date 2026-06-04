"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const faqs = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can move between Basic, Medium, and Pro as your email workflow grows.",
  },
  {
    question: "What happens when I switch to yearly billing?",
    answer:
      "The pricing cards show the discounted monthly-equivalent price with the yearly interval active.",
  },
  {
    question: "Do all plans include templates?",
    answer:
      "Yes. Paid plans include premium templates and sharing preview links.",
  },
  {
    question: "Which plan should a team choose?",
    answer:
      "Medium works well for small teams. Pro is better for larger agency workflows and higher monthly volume.",
  },
];

export function PricingFaq() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-24 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold leading-none text-madoo-text">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-base leading-7 text-madoo-muted">
          Answers for plan changes, billing, and choosing the right workspace
          tier.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-3xl gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="madoo-paper-border group rounded-[28px] bg-madoo-paper px-6 py-5"
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
          </details>
        ))}
      </div>
    </section>
  );
}
