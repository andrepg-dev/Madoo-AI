"use client";

import { fetchEmails } from "@/actions/emails";
import { useAuthStore } from "@/stores/auth-store";
import {
  Add01Icon,
  DiamondIcon,
  Folder01Icon,
  Home01Icon,
  Mail01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, cx } from "@madoo/design-system";
import type { EmailDto } from "@madoo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  description?: string;
  id: string;
  imageSrc?: string;
  /** Rendered email screenshot, shown in the right-hand hover preview only. */
  previewUrl?: string;
  label: string;
  href: string;
  group: "Recent projects" | "Navigate to" | "Providers";
  icon: IconSvgElement;
};

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

const providerItems: SearchItem[] = [
  {
    id: "provider-mailchimp",
    label: "Mailchimp",
    description: "Sync campaigns and email templates with Mailchimp.",
    href: "/providers",
    group: "Providers",
    icon: DiamondIcon,
    imageSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    id: "provider-klaviyo",
    label: "Klaviyo",
    description: "Connect lifecycle email templates for ecommerce flows.",
    href: "/providers",
    group: "Providers",
    icon: DiamondIcon,
    imageSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    id: "provider-hubspot",
    label: "HubSpot",
    description: "Prepare email assets for your CRM marketing workspace.",
    href: "/providers",
    group: "Providers",
    icon: DiamondIcon,
    imageSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    id: "provider-brevo",
    label: "Brevo",
    description: "Export templates for email campaigns and automation.",
    href: "/providers",
    group: "Providers",
    icon: DiamondIcon,
    imageSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    id: "provider-mailerlite",
    label: "MailerLite",
    description: "Use generated templates in MailerLite newsletters.",
    href: "/providers",
    group: "Providers",
    imageSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
    icon: DiamondIcon,
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
    { "Recent projects": [], "Navigate to": [], Providers: [] },
  );
}

function getEmailTitle(email: EmailDto): string {
  const latestVariant = email.variants[email.variants.length - 1];
  return (
    latestVariant?.subject || email.title || email.prompt || "Untitled email"
  );
}

function emailToSearchItem(email: EmailDto): SearchItem {
  return {
    id: `email-${email.id}`,
    label: getEmailTitle(email),
    href: `/email-template-project?id=${encodeURIComponent(email.id)}`,
    group: "Recent projects",
    // Row shows a clean icon; the screenshot is only used in the hover preview.
    icon: Mail01Icon,
    previewUrl:
      email.variants[email.variants.length - 1]?.previewUrl ?? undefined,
  };
}

function fuzzyIncludes(value: string, query: string): boolean {
  if (!query) return true;
  let queryIndex = 0;
  for (const character of value) {
    if (character === query[queryIndex]) queryIndex += 1;
    if (queryIndex === query.length) return true;
  }
  return false;
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
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const present = useCommandModalPresence(open);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: emails = [] } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    enabled: open && Boolean(user),
    initialData: () => queryClient.getQueryData<EmailDto[]>(["emails"]),
  });

  const recentProjectItems = useMemo(
    () =>
      [...emails]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5)
        .map(emailToSearchItem),
    [emails],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allItems = [
      ...recentProjectItems,
      ...navigationItems,
      ...providerItems,
    ];

    if (!normalizedQuery) return allItems;

    return allItems.filter((item) => {
      const searchable =
        `${item.label} ${item.description ?? ""}`.toLowerCase();
      return (
        searchable.includes(normalizedQuery) ||
        fuzzyIncludes(searchable, normalizedQuery)
      );
    });
  }, [query, recentProjectItems]);

  const groupedItems = useMemo(() => groupItems(filteredItems), [filteredItems]);
  const activeItem = filteredItems[activeIndex];
  // Only recent-project rows carry a rendered template screenshot (previewUrl);
  // provider rows use a favicon, so don't preview those.
  const previewItem =
    activeItem?.group === "Recent projects" && activeItem.previewUrl
      ? activeItem
      : undefined;

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
    // Providers aren't navigable yet — selecting one is a no-op.
    if (item.group === "Providers") return;
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
      className="fixed inset-0 z-120 flex items-center justify-center bg-[rgb(var(--ink-shadow-rgb)/0.14)] px-4 py-4 backdrop-blur-[1px] will-change-[opacity,backdrop-filter] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-modal-overlay-out data-[state=open]:animate-madoo-modal-overlay-in motion-reduce:animate-none"
      data-state={open ? "open" : "closed"}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        aria-label="Search"
        aria-modal="true"
        className={cx(
          "flex h-[min(540px,calc(100dvh-110px))] origin-center flex-row overflow-hidden rounded-[20px] bg-madoo-surface text-sm text-madoo-ink shadow-[var(--shadow-border-rule-hover),0_18px_52px_rgb(var(--ink-shadow-rgb)/0.16)] transition-[width] duration-200 ease-out will-change-[opacity,transform] data-[state=closed]:animate-madoo-modal-out data-[state=open]:animate-madoo-modal-in max-sm:h-[min(520px,calc(100dvh-24px))] max-sm:w-full max-sm:rounded-[18px] motion-reduce:animate-none",
          previewItem
            ? "w-[min(980px,calc(100vw-32px))]"
            : "w-[min(720px,calc(100vw-32px))]",
        )}
        data-state={open ? "open" : "closed"}
        onClick={stopPropagation}
        role="dialog"
      >
        <div
          className={cx(
            "flex h-full w-full min-w-0 flex-col",
            previewItem ? "sm:w-110 sm:shrink-0" : "sm:w-full",
          )}
        >
        <div className="flex h-10.5 shrink-0 animate-madoo-modal-content-in items-center gap-2 px-4 max-sm:h-10.5 max-sm:px-3 motion-reduce:animate-none">
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
            autoFocus
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
              {(["Recent projects", "Navigate to", "Providers"] as const).map(
                (group) => {
                  const items = groupedItems[group];
                  if (!items.length) return null;

                  return (
                    <section
                      key={group}
                      aria-label={group}
                      className="grid gap-2"
                    >
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
                                item.imageSrc
                                  ? "grid min-h-14.5 w-full cursor-pointer grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-normal leading-none outline-none max-sm:px-2"
                                  : "grid h-10 max-h-10 w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] px-3 text-left text-sm font-normal leading-none outline-none max-sm:h-12 max-sm:px-2",
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
                                {item.imageSrc ? (
                                  <img
                                    alt=""
                                    className="size-6 rounded-md bg-madoo-surface-2 object-contain p-0.5"
                                    loading="lazy"
                                    src={item.imageSrc}
                                  />
                                ) : (
                                  <CommandIcon icon={item.icon} size={14} />
                                )}
                              </span>
                              <span className="grid min-w-0 gap-1">
                                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                  {item.label}
                                </span>
                                {item.description ? (
                                  <span
                                    className={cx(
                                      "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs",
                                      active
                                        ? "text-madoo-accent-fg opacity-80"
                                        : "text-madoo-ink-muted",
                                    )}
                                  >
                                    {item.description}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          ) : (
            <div className="px-4 py-10 text-sm text-madoo-ink-muted">
              No results found
            </div>
          )}
        </div>

        <div className="flex h-12 shrink-0 animate-madoo-modal-content-in items-center justify-between px-4 [animation-delay:36ms] max-sm:px-4 motion-reduce:animate-none">
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

        {previewItem?.previewUrl ? (
          <aside className="hidden min-w-0 flex-1 flex-col border-l border-[rgb(var(--rule-rgb)/0.12)] bg-[rgb(var(--rule-rgb)/0.04)] sm:flex">
            <div className="madoo-command-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              <img
                alt={previewItem.label}
                className="w-full rounded-lg bg-white object-contain object-top shadow-madoo-border"
                src={previewItem.previewUrl}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
