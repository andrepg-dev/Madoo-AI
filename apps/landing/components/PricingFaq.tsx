"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const faqs = [
  {
    question: "What's Madoo AI and how does it work?",
    answer:
      "Madoo AI is an AI email design company. It's built for marketers and agencies that don't want to keep using drag-and-drop tools and want to create professional email templates with professional specialized AI tools.",
  },
  {
    question: "Can I change my plan?",
    answer:
      "Yes. You can change your plan at any time.",
  },
  {
    question: "Is there any free trial?",
    answer:
      "Yes. New users get a 7-day free trial, and no credit card is needed.",
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
