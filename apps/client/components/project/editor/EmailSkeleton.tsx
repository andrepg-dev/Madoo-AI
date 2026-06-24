/**
 * Shimmering placeholder of an email shown in the preview pane while the AI is
 * generating and there's no rendered email yet — so the right side feels like an
 * email taking shape rather than empty space.
 */
export function EmailSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-madoo-bg/40 p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-5 shadow-madoo-border">
        {/* Header: logo + nav */}
        <div className="flex items-center justify-between">
          <div className="madoo-skeleton h-6 w-24 rounded-md" />
          <div className="flex gap-2">
            <div className="madoo-skeleton h-3 w-10 rounded" />
            <div className="madoo-skeleton h-3 w-10 rounded" />
            <div className="madoo-skeleton h-3 w-10 rounded" />
          </div>
        </div>

        {/* Hero */}
        <div className="madoo-skeleton mt-5 h-40 w-full rounded-xl" />

        {/* Body copy */}
        <div className="mt-5 space-y-2.5">
          <div className="madoo-skeleton h-3 w-3/4 rounded" />
          <div className="madoo-skeleton h-3 w-full rounded" />
          <div className="madoo-skeleton h-3 w-5/6 rounded" />
        </div>

        {/* CTA */}
        <div className="madoo-skeleton mx-auto mt-6 h-10 w-40 rounded-full" />

        {/* Footer socials */}
        <div className="mt-6 flex justify-center gap-3">
          <div className="madoo-skeleton h-6 w-6 rounded-full" />
          <div className="madoo-skeleton h-6 w-6 rounded-full" />
          <div className="madoo-skeleton h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
