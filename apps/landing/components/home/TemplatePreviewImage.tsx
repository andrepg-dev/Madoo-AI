"use client";

import { useEffect, useState } from "react";

/**
 * Homepage showcase tiles are all the same shape: a tall portrait card whose
 * image is cropped from the top. Long emails lose their tail instead of making
 * the row ragged.
 */
export const SHOWCASE_TILE_RATIO = 2.15;
/**
 * Templates whose screenshot is shorter than this (height / width) are skipped
 * in the showcase — a stubby email in a tall tile would be mostly empty crop.
 */
export const SHOWCASE_MIN_RATIO = 1.5;

/**
 * Keeps only the templates whose preview screenshot is tall enough for the
 * showcase, capped at `limit`. Dimensions are only known once the image loads,
 * so this measures them in the browser and returns the survivors.
 */
export function useTallTemplates<T extends { imageSrc?: string }>(
  cards: T[],
  limit: number,
): T[] {
  const [tall, setTall] = useState<T[]>([]);

  useEffect(() => {
    let cancelled = false;
    const isTallEnough = (card: T) =>
      new Promise<boolean>((resolve) => {
        const src = card.imageSrc;
        if (!src) {
          resolve(false);
          return;
        }
        const image = new Image();
        image.onload = () => {
          const ratio =
            image.naturalWidth > 0
              ? image.naturalHeight / image.naturalWidth
              : 0;
          resolve(ratio >= SHOWCASE_MIN_RATIO);
        };
        image.onerror = () => resolve(false);
        image.src = src;
      });

    void Promise.all(cards.map(isTallEnough)).then((results) => {
      if (cancelled) return;
      setTall(cards.filter((_, index) => results[index]).slice(0, limit));
    });

    return () => {
      cancelled = true;
    };
  }, [cards, limit]);

  return tall;
}

/** Uniform showcase tile: fixed portrait shape, screenshot cropped from the top. */
export function TemplateShowcaseImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div
      className="relative flex w-full items-start justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition group-hover:shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.28)] group-focus-visible:ring-2 group-focus-visible:ring-[#5b63ff]/40"
      style={{ aspectRatio: 1 / SHOWCASE_TILE_RATIO }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top brightness-[1.05] contrast-[1.02] saturate-[1.03]"
        loading="lazy"
      />
    </div>
  );
}

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
