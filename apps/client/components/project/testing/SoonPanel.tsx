"use client";

import { Link01Icon, Shield01Icon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@madoo/design-system";

type SoonPanelProps = {
  kind: "links" | "spam";
};

const copy = {
  links: {
    title: "Links Testing",
    body: "Scan URLs to detect broken links, missing UTMs, and inconsistent campaign names. Be sure everything loads properly on all devices.",
    icon: Link01Icon,
  },
  spam: {
    title: "Spam Testing",
    body: "Review common deliverability signals, sender setup, and content patterns before campaigns leave the workspace.",
    icon: Shield01Icon,
  },
} as const;

export function SoonPanel({ kind }: SoonPanelProps) {
  const item = copy[kind];

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-madoo-surface text-madoo-ink">
          <HugeiconsIcon
            aria-hidden="true"
            icon={item.icon}
            primaryColor="currentColor"
            size={19}
            strokeWidth={1.7}
          />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-madoo-ink">
              {item.title}
            </h3>
            <Badge tone="success">Soon</Badge>
          </div>
        </div>
      </div>
      <p className="max-w-lg text-sm leading-6 text-madoo-ink-soft">
        {item.body}
      </p>
      <Button
        className="bg-[#16a34a] text-white hover:bg-[#15803d]"
        type="button"
        variant="primary"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={ThumbsUpIcon}
          primaryColor="currentColor"
          size={17}
          strokeWidth={1.7}
        />
        <span>Like it</span>
      </Button>
    </section>
  );
}
