"use client";

import {
  clientHomeUrl,
  clientUseTemplateUrl,
  isLikelySignedIn,
} from "@/lib/client-app";
import type { LandingCommunityTemplate } from "@/lib/community-templates";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@madoo/design-system";
import { useEffect, useMemo, useState } from "react";
import AuthDialog from "./AuthDialog";
import { TEMPLATE_ROLE_LABELS, localeCopy } from "./HomePage";
import { LandingHeader } from "./LandingHeader";
import TemplatePreviewDialog, {
  type TemplatePreviewData,
} from "./TemplatePreviewDialog";

type Locale = "en" | "es";

const ALL_CATEGORY = "all";

// Tile heights (height / width) used only before the preview loads so the
// masonry reserves space and doesn't shift as screenshots stream in. Once the
// real image loads the card grows to the screenshot's full natural height so a
// long email reads as a tall card instead of being cropped into a short box.
const TEMPLATE_DEFAULT_HEIGHT_RATIOS = [1.25, 1.4, 1.33, 1.43, 1.5] as const;

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
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplatePreviewData | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [usingTemplate, setUsingTemplate] = useState(false);
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

  const openPreview = (template: LandingCommunityTemplate) =>
    setPreviewTemplate({
      id: template.id,
      name: template.name,
      description:
        template.description ??
        template.category ??
        copy.templates.communityFallbackDescription,
      imageSrc: template.previewUrl ?? "/templates/news-letter.png",
      authorName: template.authorName,
      category: template.category,
      variables: template.variables,
    });

  // View is free; "Use" needs a session. Signed-in visitors go straight to the
  // app, otherwise we open the login dialog and resume into the app after auth.
  const handleUseTemplate = (template: TemplatePreviewData) => {
    if (!template.id) {
      setPreviewTemplate(null);
      setAuthDialogOpen(true);
      return;
    }

    const target = clientUseTemplateUrl(template.id);
    if (isLikelySignedIn()) {
      setUsingTemplate(true);
      window.location.assign(target);
      return;
    }

    setNextUrl(target);
    setPreviewTemplate(null);
    setAuthDialogOpen(true);
  };

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
          <div className="columns-1 gap-4 xs:columns-2 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredTemplates.map((template, index) => (
              <GalleryCard
                key={template.id}
                template={template}
                index={index}
                previewAlt={copy.templates.previewAlt}
                onOpen={() => openPreview(template)}
              />
            ))}
          </div>
        ) : (
          <div className="madoo-paper-border grid min-h-60 place-items-center rounded-2xl bg-white px-6 text-center text-sm text-madoo-muted">
            {copy.templates.empty}
          </div>
        )}
      </section>

      <TemplatePreviewDialog
        template={previewTemplate}
        isUsing={usingTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
        copy={{
          close: copy.templates.close,
          by: copy.templates.by,
          variables: copy.templates.variables,
          noVariables: copy.templates.noVariables,
          use: copy.templates.use,
          using: copy.templates.using,
          roleLabels: TEMPLATE_ROLE_LABELS,
        }}
      />

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        locale={locale}
        nextUrl={nextUrl}
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
  index,
  previewAlt,
  onOpen,
}: {
  template: LandingCommunityTemplate;
  index: number;
  previewAlt: string;
  onOpen: () => void;
}) {
  const category = template.categories[0] ?? template.category;
  const [loaded, setLoaded] = useState(false);
  const placeholderRatio =
    TEMPLATE_DEFAULT_HEIGHT_RATIOS[
      index % TEMPLATE_DEFAULT_HEIGHT_RATIOS.length
    ];

  return (
    <article className="group mb-7 block min-w-0 break-inside-avoid">
      <button
        type="button"
        onClick={onOpen}
        aria-label={template.name}
        className="madoo-paper-border madoo-paper-border-hover relative block w-full cursor-pointer overflow-hidden rounded-lg bg-white p-0 transition focus-visible:outline-none focus-visible:shadow-[0_0_0_1.5px_rgb(91_99_255/0.5)]"
        style={loaded ? undefined : { aspectRatio: 1 / placeholderRatio }}
      >
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={`${template.name} ${previewAlt}`}
            loading="lazy"
            className="block h-auto w-full brightness-[1.03] transition duration-200 group-hover:scale-[1.02]"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="grid aspect-[3/4] w-full place-items-center bg-madoo-neutral-50 text-xs text-madoo-muted">
            {template.name}
          </div>
        )}
      </button>

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
