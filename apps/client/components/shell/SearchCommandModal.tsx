"use client";

import {
  Add01Icon,
  DiamondIcon,
  Folder01Icon,
  Home01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, cx } from "@madoo/design-system";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

type SearchCommandModalProps = {
  open: boolean;
  onClose: () => void;
};

const MODAL_EXIT_MS = 170;

type SearchItem = {
  id: string;
  label: string;
  href: string;
  group: "Recent projects" | "Navigate to";
  icon: IconSvgElement;
};

const recentProjects: SearchItem[] = [
  {
    id: "hello-friends",
    label: "Hello Friends",
    href: "/email-template-project",
    group: "Recent projects",
    icon: DiamondIcon,
  },
  {
    id: "daily-spark",
    label: "Your Daily Spark",
    href: "/email-template-project",
    group: "Recent projects",
    icon: DiamondIcon,
  },
  {
    id: "hopta",
    label: "Hopta.hn Landing Page",
    href: "/email-template-project",
    group: "Recent projects",
    icon: DiamondIcon,
  },
  {
    id: "anta-airways",
    label: "Anta Airways: Elevated Travel Experiences",
    href: "/email-template-project",
    group: "Recent projects",
    icon: DiamondIcon,
  },
  {
    id: "puppy",
    label: "Puppy Landing Page (43)",
    href: "/email-template-project",
    group: "Recent projects",
    icon: DiamondIcon,
  },
];

const navigationItems: SearchItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    group: "Navigate to",
    icon: Home01Icon,
  },
  {
    id: "create-project",
    label: "Create new project",
    href: "/",
    group: "Navigate to",
    icon: Add01Icon,
  },
];

function CommandIcon({
  icon,
  size = 14,
}: {
  icon: IconSvgElement;
  size?: number;
}) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      focusable="false"
      icon={icon}
      primaryColor="currentColor"
      size={size}
      strokeWidth={1.45}
    />
  );
}

function groupItems(items: SearchItem[]) {
  return items.reduce<Record<SearchItem["group"], SearchItem[]>>(
    (groups, item) => {
      groups[item.group].push(item);
      return groups;
    },
    { "Recent projects": [], "Navigate to": [] },
  );
}

function useCommandModalPresence(open: boolean) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    const timeout = window.setTimeout(() => setPresent(false), MODAL_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return present;
}

export function SearchCommandModal({ open, onClose }: SearchCommandModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const present = useCommandModalPresence(open);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allItems = [...recentProjects, ...navigationItems];

    if (!normalizedQuery) return allItems;

    return allItems.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const groupedItems = useMemo(() => groupItems(filteredItems), [filteredItems]);
  const activeItem = filteredItems[activeIndex];

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!present) return null;

  const openItem = (item: SearchItem | undefined) => {
    if (!item) return;
    router.push(item.href);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) =>
        filteredItems.length ? (value + 1) % filteredItems.length : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) =>
        filteredItems.length
          ? (value - 1 + filteredItems.length) % filteredItems.length
          : 0,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openItem(activeItem);
    }
  };

  const handleOverlayClick = () => onClose();
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgb(var(--ink-shadow-rgb)_/_0.14)] px-4 py-4 backdrop-blur-[1px] will-change-[opacity,backdrop-filter] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-modal-overlay-out data-[state=open]:animate-madoo-modal-overlay-in motion-reduce:animate-none"
      data-state={open ? "open" : "closed"}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        aria-label="Search"
        aria-modal="true"
        className="flex h-[min(500px,calc(100dvh-110px))] w-[min(720px,calc(100vw-32px))] origin-center flex-col overflow-hidden rounded-[20px] bg-madoo-surface text-sm text-madoo-ink shadow-[var(--shadow-border-rule-hover),0_18px_52px_rgb(var(--ink-shadow-rgb)_/_0.16)] will-change-[opacity,transform] data-[state=closed]:animate-madoo-modal-out data-[state=open]:animate-madoo-modal-in max-sm:h-[min(520px,calc(100dvh-24px))] max-sm:w-full max-sm:rounded-[18px] motion-reduce:animate-none"
        data-state={open ? "open" : "closed"}
        onClick={stopPropagation}
        role="dialog"
      >
        <div className="flex h-[42px] shrink-0 animate-madoo-modal-content-in items-center gap-2 px-4 max-sm:h-[42px] max-sm:px-3 motion-reduce:animate-none">
          <span className="text-madoo-ink-soft">
            <CommandIcon icon={Search01Icon} size={14} />
          </span>
          <input
            aria-activedescendant={
              activeItem ? `${listboxId}-${activeItem.id}` : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded="true"
            autoComplete="off"
            className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm leading-none text-madoo-ink shadow-none outline-none placeholder:text-madoo-ink-muted"
            data-madoo-control
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            ref={inputRef}
            role="combobox"
            type="text"
            value={query}
          />
        </div>

        <div
          className="madoo-command-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3"
          id={listboxId}
          role="listbox"
        >
          {filteredItems.length ? (
            <div className="grid animate-madoo-modal-content-in gap-4 [animation-delay:24ms] motion-reduce:animate-none">
              {(["Recent projects", "Navigate to"] as const).map((group) => {
                const items = groupedItems[group];
                if (!items.length) return null;

                return (
                  <section key={group} aria-label={group} className="grid gap-2">
                    <h2 className="px-3 text-xs font-medium leading-none text-madoo-ink-muted max-sm:px-2">
                      {group}
                    </h2>
                    <div className="grid gap-1">
                      {items.map((item) => {
                        const itemIndex = filteredItems.findIndex(
                          (currentItem) => currentItem.id === item.id,
                        );
                        const active = itemIndex === activeIndex;

                        return (
                          <button
                            aria-selected={active}
                            className={cx(
                              "grid h-10 max-h-10 w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] px-3 text-left text-sm font-normal leading-none outline-none max-sm:h-[48px] max-sm:px-2",
                              active
                                ? "bg-madoo-accent text-madoo-accent-fg"
                                : "bg-transparent text-madoo-ink hover:bg-madoo-surface-2",
                            )}
                            id={`${listboxId}-${item.id}`}
                            key={item.id}
                            onClick={() => openItem(item)}
                            onMouseEnter={() => setActiveIndex(itemIndex)}
                            role="option"
                            type="button"
                          >
                            <span className="flex size-5 items-center justify-center max-sm:size-5">
                              <CommandIcon icon={item.icon} size={14} />
                            </span>
                            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-sm text-madoo-ink-muted">
              No results found
            </div>
          )}
        </div>

        <div className="flex h-[48px] shrink-0 animate-madoo-modal-content-in items-center justify-between px-4 [animation-delay:36ms] max-sm:px-4 motion-reduce:animate-none">
          <span aria-hidden="true" className="text-madoo-ink-faint">
            <CommandIcon icon={Folder01Icon} size={14} />
          </span>
          <Button
            disabled={!activeItem}
            onClick={() => openItem(activeItem)}
            size="sm"
            variant="ghost"
            className="bg-transparent! text-sm! font-normal! text-madoo-ink! hover:bg-madoo-surface-2! disabled:opacity-40"
          >
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}
