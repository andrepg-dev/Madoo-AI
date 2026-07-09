"use client";

import { clientHomeUrl, isLikelySignedIn } from "@/lib/client-app";
import type { LandingCommunityTemplate } from "@/lib/community-templates";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@madoo/design-system";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthDialog from "./AuthDialog";
import { localeCopy } from "./HomePage";
import { LandingHeader } from "./LandingHeader";

type Locale = "en" | "es";

const ALL_CATEGORY = "all";

export default function TemplatesGallery({
  locale = "en",
  templates,
}: {
  locale?: Locale;
  templates: LandingCommunityTemplate[];
}) {
  const copy = localeCopy[locale];
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Cookies aren't readable during SSR; detect the session after mount so the
  // header CTA doesn't cause a hydration mismatch.
  useEffect(() => setSignedIn(isLikelySignedIn()), []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const template of templates) {
      for (const category of template.categories) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return counts;
  }, [templates]);

  const categories = useMemo(
    () =>
      Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b)),
    [categoryCounts],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const inCategory =
        activeCategory === ALL_CATEGORY ||
        template.categories.includes(activeCategory);
      if (!inCategory) return false;
      if (!query) return true;
      return (
        template.name.toLowerCase().includes(query) ||
        (template.description ?? "").toLowerCase().includes(query) ||
        template.categories.some((category) =>
          category.toLowerCase().includes(query),
        )
      );
    });
  }, [templates, activeCategory, search]);

  return (
    <main
      lang={locale}
      className="relative min-h-screen w-full bg-madoo-page font-ibm-plex-sans"
    >
      <LandingHeader
        copy={copy.nav}
        scrolledBackgroundClassName="bg-madoo-page/80 backdrop-blur"
        onAuthClick={signedIn ? undefined : () => setAuthDialogOpen(true)}
        appUrl={signedIn ? clientHomeUrl() : undefined}
        goToAppLabel={copy.nav.goToApp}
      />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-none text-madoo-text sm:text-5xl">
              {copy.templates.galleryTitle}
            </h1>
            <p className="mt-4 text-base leading-7 text-madoo-muted">
              {copy.templates.galleryDescription}
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-madoo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.templates.searchPlaceholder}
              aria-label={copy.templates.searchPlaceholder}
              className="madoo-paper-border h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-madoo-ink outline-none transition placeholder:text-madoo-muted focus-visible:shadow-[0_0_0_1.5px_rgb(91_99_255/0.5)]"
            />
          </div>
        </div>

        {categories.length ? (
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={activeCategory === ALL_CATEGORY}
              label={`${copy.templates.all} ${templates.length}`}
              onClick={() => setActiveCategory(ALL_CATEGORY)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category}
                active={activeCategory === category}
                label={`${category} ${categoryCounts.get(category) ?? 0}`}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        ) : null}

        {filteredTemplates.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredTemplates.map((template) => (
              <GalleryCard
                key={template.id}
                template={template}
                previewAlt={copy.templates.previewAlt}
              />
            ))}
          </div>
        ) : (
          <div className="madoo-paper-border grid min-h-60 place-items-center rounded-2xl bg-white px-6 text-center text-sm text-madoo-muted">
            {copy.templates.empty}
          </div>
        )}
      </section>

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        locale={locale}
      />
    </main>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "h-9 cursor-pointer rounded-full border-0 px-4 text-[13px] font-medium transition",
        active
          ? "bg-madoo-ink text-white"
          : "madoo-paper-border madoo-paper-border-hover bg-white text-madoo-copy hover:text-madoo-ink",
      )}
    >
      {label}
    </button>
  );
}

function GalleryCard({
  template,
  previewAlt,
}: {
  template: LandingCommunityTemplate;
  previewAlt: string;
}) {
  const category = template.categories[0] ?? template.category;

  return (
    <article className="group min-w-0">
      <Link
        href={`/templates/${template.id}`}
        aria-label={template.name}
        className="madoo-paper-border madoo-paper-border-hover relative block aspect-3/4 w-full cursor-pointer overflow-hidden rounded-lg bg-white p-0 transition focus-visible:outline-none focus-visible:shadow-[0_0_0_1.5px_rgb(91_99_255/0.5)]"
      >
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={`${template.name} ${previewAlt}`}
            loading="lazy"
            className="h-full w-full object-cover object-top brightness-[1.03] transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-madoo-neutral-50 text-xs text-madoo-muted">
            {template.name}
          </div>
        )}
      </Link>

      <div className="mt-2.5 min-w-0">
        <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
          {template.name}
        </h3>
        {category ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-madoo-muted">
            {category}
          </p>
        ) : null}
      </div>
    </article>
  );
}
