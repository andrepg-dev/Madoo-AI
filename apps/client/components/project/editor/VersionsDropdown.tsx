import { Button, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { EmailVariantDto } from "@madoo/shared";

export function VersionsDropdown({
  variants,
  activeId,
  latestId,
  onSelect,
}: {
  variants: EmailVariantDto[];
  activeId: string | undefined;
  latestId: string | undefined;
  onSelect: (id: string | null) => void;
}) {
  if (variants.length <= 1) return null;

  const ordered = [...variants].sort((a, b) => b.seq - a.seq);
  const active = ordered.find((item) => item.id === activeId) ?? ordered[0];

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          size="sm"
          variant="secondary"
        >
          <span>
            Version {active.seq}
            {active.id === latestId ? " · latest" : ""}
          </span>
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-madoo-ink-muted"
            icon={ArrowDown01Icon}
            primaryColor="currentColor"
          />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-56 gap-0.5 p-1.5!">
        {ordered.map((item) => (
          <DropdownItem
            className="justify-start! gap-2 px-2! py-1.5! text-[13px]!"
            key={item.id}
            onSelect={() => onSelect(item.id === latestId ? null : item.id)}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="truncate">
                Version {item.seq}
                {item.id === latestId ? " (latest)" : ""}
              </span>
              {item.id === active.id ? (
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-madoo-accent-deep"
                  icon={Tick02Icon}
                  primaryColor="currentColor"
                />
              ) : null}
            </span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
