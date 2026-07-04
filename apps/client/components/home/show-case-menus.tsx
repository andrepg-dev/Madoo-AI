import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Icon,
  cx,
} from "@madoo/design-system";
import type { CommunityTemplateCategory, EmailDto } from "@madoo/shared";

import {
  CommunityCategoryFilter,
  getEmailTitle,
} from "./show-case-utils";

const compactMenuItemClass = "justify-start! px-2! py-1.5! text-[13px]!";

export function CommunityCategoryFilterChips({
  active,
  counts,
  onChange,
  options,
  total,
}: {
  active: CommunityCategoryFilter;
  counts: Map<CommunityTemplateCategory, number>;
  onChange: (category: CommunityCategoryFilter) => void;
  options: CommunityTemplateCategory[];
  total: number;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <button
        aria-pressed={active === "all"}
        className={cx(
          "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
          active === "all"
            ? "bg-madoo-ink text-white"
            : "bg-white text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
        )}
        onClick={() => onChange("all")}
        type="button"
      >
        All {total}
      </button>
      {options.map((category) => (
        <button
          aria-pressed={active === category}
          className={cx(
            "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
            active === category
              ? "bg-madoo-ink text-white"
              : "bg-white text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
          )}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category} {counts.get(category) ?? 0}
        </button>
      ))}
    </div>
  );
}

export function EmailCardMenu({
  email,
  onShare,
}: {
  email: EmailDto;
  onShare: (email: EmailDto) => void;
}) {
  const title = getEmailTitle(email);

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          aria-label={`Open actions for ${title}`}
          className="min-h-7 min-w-7 shrink-0 rounded-md px-0!"
          size="sm"
          variant="ghost"
        >
          <Icon name="moreHorizontal" size={14} />
        </Button>
      </DropdownTrigger>
      <DropdownContent
        align="end"
        className="w-52 gap-0.5 overflow-hidden p-1!"
      >
        <DropdownItem
          className={compactMenuItemClass}
          onSelect={() => onShare(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="send" size={14} />
            Share to community
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function CommunityCardMenu({
  onMakePrivate,
  title,
}: {
  onMakePrivate: () => void;
  title: string;
}) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          aria-label={`Open actions for ${title}`}
          className="min-h-7 min-w-7 shrink-0 rounded-md px-0!"
          size="sm"
          variant="ghost"
        >
          <Icon name="moreHorizontal" size={14} />
        </Button>
      </DropdownTrigger>
      <DropdownContent
        align="end"
        className="w-52 gap-0.5 overflow-hidden p-1!"
      >
        <DropdownItem className={compactMenuItemClass} onSelect={onMakePrivate}>
          <span className="flex items-center gap-2.5">
            <Icon name="lock" size={14} />
            Make private
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
