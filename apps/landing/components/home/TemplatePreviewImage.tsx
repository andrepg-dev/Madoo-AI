"use client";

import { useState } from "react";

// Tile heights (height / width) used before the preview image loads so the
// showcase stays lively while screenshots stream in.
export const TEMPLATE_MIN_HEIGHT_RATIO = 0.6;
export const TEMPLATE_MAX_HEIGHT_RATIO = 2.3;

export function clampTemplateHeightRatio(ratio: number): number {
  return Math.min(
    TEMPLATE_MAX_HEIGHT_RATIO,
    Math.max(TEMPLATE_MIN_HEIGHT_RATIO, ratio),
  );
}

/**
 * Preview image whose tile grows to the screenshot's real aspect ratio, so long
 * email templates render as tall cards instead of being squeezed flat.
 */
export function TemplatePreviewImage({
  src,
  alt,
  defaultHeightRatio,
}: {
  src: string;
  alt: string;
  defaultHeightRatio: number;
}) {
  const [heightRatio, setHeightRatio] = useState(defaultHeightRatio);

  return (
    <div
      className="relative max-w-62 flex min-h-0 items-start justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition group-hover:shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.28)] group-focus-visible:ring-2 group-focus-visible:ring-[#5b63ff]/40"
      style={{ aspectRatio: 1 / heightRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top brightness-[1.05] contrast-[1.02] saturate-[1.03]"
        loading="lazy"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            setHeightRatio(
              clampTemplateHeightRatio(naturalHeight / naturalWidth),
            );
          }
        }}
      />
    </div>
  );
}

// One representative card per category, for the homepage showcase row. Picks the
// first template seen for each category (templates arrive newest-first) up to a
// small cap so the section reads as a clean category overview, not a full grid.
export function pickCategoryShowcase<T extends { category?: string | null }>(
  cards: T[],
  max: number,
): T[] {
  const seen = new Set<string>();
  const showcase: T[] = [];
  for (const card of cards) {
    const category = card.category;
    if (!category || seen.has(category)) continue;
    seen.add(category);
    showcase.push(card);
    if (showcase.length >= max) break;
  }
  return showcase;
}
