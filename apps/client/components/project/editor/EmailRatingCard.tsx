import { Icon, cx } from "@madoo/design-system";
import type { EmailRatingDto, EmailRatingInput } from "@madoo/shared";
import { useEffect, useState } from "react";

type EmailRatingCardProps = {
  loading?: boolean;
  pending?: boolean;
  rating: EmailRatingDto | null | undefined;
  onSubmit: (input: EmailRatingInput) => void;
};

export function EmailRatingCard({
  loading = false,
  pending = false,
  rating,
  onSubmit,
}: EmailRatingCardProps) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setSelected(rating?.rating ?? 0);
    setComment(rating?.comment ?? "");
  }, [rating]);

  const activeStars = hovered || selected;
  const disabled = loading || pending;

  // The card exists only to collect the first rating: while the existing
  // rating loads, and once one has been submitted, render nothing at all.
  if (loading || rating) return null;

  return (
    <section className="mb-3 rounded-md bg-white p-3 shadow-madoo-border">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold leading-none text-madoo-ink">
            Rate this email
          </h2>
          <p className="mt-1 text-xs text-madoo-ink-muted">
            Help tune future output.
          </p>
        </div>
        <div
          aria-label="Email rating"
          className="flex items-center gap-1"
          onMouseLeave={() => setHovered(0)}
          role="radiogroup"
        >
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              aria-label={`${stars} star${stars === 1 ? "" : "s"}`}
              aria-checked={selected === stars}
              className={cx(
                "grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-madoo-ink-muted transition hover:bg-madoo-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-madoo-ink/20",
                activeStars >= stars && "text-amber-500 [&_svg]:fill-current",
              )}
              disabled={disabled}
              key={stars}
              onClick={() => setSelected(stars)}
              onMouseEnter={() => setHovered(stars)}
              role="radio"
              type="button"
            >
              <Icon name="star" size={18} />
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="mt-3 min-h-16 w-full resize-none rounded-md border-0 bg-madoo-bg px-3 py-2 text-sm text-madoo-ink shadow-[inset_0_0_0_0.75px_rgb(var(--ink-shadow-rgb)/0.16)] outline-none placeholder:text-madoo-ink-muted/70 focus:shadow-[inset_0_0_0_1px_rgb(var(--ink-shadow-rgb)/0.28)]"
        disabled={disabled}
        maxLength={2000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional comment"
        value={comment}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-madoo-ink-muted">
          {selected ? `${selected}/5 selected` : "Pick 1-5 stars"}
        </span>
        <button
          className="h-8 cursor-pointer rounded-md border-0 bg-madoo-ink px-3 text-xs font-semibold text-white transition hover:bg-madoo-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || selected === 0}
          onClick={() =>
            onSubmit({
              rating: selected,
              ...(comment.trim() ? { comment: comment.trim() } : {}),
            })
          }
          type="button"
        >
          {pending ? "Saving..." : "Submit"}
        </button>
      </div>
    </section>
  );
}
