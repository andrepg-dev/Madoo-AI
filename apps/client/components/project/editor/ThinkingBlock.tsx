import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ThinkingBlock({
  text,
  seconds,
  active,
}: {
  text: string;
  seconds?: number;
  active?: boolean;
}) {
  return (
    <details className="group mb-2.5" open>
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-madoo-ink-muted transition-colors hover:text-madoo-ink [&::-webkit-details-marker]:hidden">
        <span>Thought process</span>
        <HugeiconsIcon
          aria-hidden="true"
          className="transition-transform group-open:rotate-180"
          icon={ArrowDown01Icon}
          primaryColor="currentColor"
          size={14}
          strokeWidth={1.7}
        />
      </summary>
      <div className="mt-2 whitespace-pre-wrap border-l-2 border-madoo-border pl-3 text-xs leading-5 text-madoo-ink-muted">
        {text}
      </div>
    </details>
  );
}
