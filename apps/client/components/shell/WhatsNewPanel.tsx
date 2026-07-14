"use client";

/**
 * Customer-facing product updates shown in the sidebar "What's new" dropdown.
 * Written for people who use Madoo, not engineers — each item says what it does
 * for them. Keep newest entry first.
 */
type WhatsNewChange = {
  title: string;
  body: string;
};

type WhatsNewEntry = {
  date: string;
  changes: WhatsNewChange[];
};

const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: "July 14, 2026",
    changes: [
      {
        title: "Click any text to edit it",
        body: "Double-click text in the preview to change it on the spot — even text that mixes your words with dynamic fields.",
      },
      {
        title: "Your uploaded images stay put",
        body: "Upload your own image, then keep prompting the AI — your image no longer gets wiped out.",
      },
      {
        title: "Test in a real inbox",
        body: "Send yourself a live copy from any template and see how it lands in Gmail, Outlook, or Apple Mail.",
      },
    ],
  },
  {
    date: "July 10, 2026",
    changes: [
      {
        title: "Test emails from your dashboard",
        body: "Every template card now has a quick “Test email” action.",
      },
      {
        title: "Every template, always visible",
        body: "Your dashboard shows all of your templates, not only the most recent ones.",
      },
      {
        title: "Shared links look sharp",
        body: "Shared email links now unfurl with a preview image of the template.",
      },
    ],
  },
];

export function WhatsNewPanel() {
  return (
    <div className="max-h-[26rem] overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-madoo-rule/60 bg-madoo-surface px-4 py-3">
        <span className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
          What's new
        </span>
      </div>
      <div className="grid gap-5 px-4 py-4">
        {WHATS_NEW.map((entry) => (
          <div key={entry.date} className="grid gap-3">
            <span className="text-(length:--font-size-sm) font-medium text-madoo-ink-muted">
              {entry.date}
            </span>
            <div className="grid gap-3">
              {entry.changes.map((change) => (
                <div key={change.title} className="grid gap-1">
                  <span className="text-(length:--font-size-base) font-medium leading-snug text-madoo-ink">
                    {change.title}
                  </span>
                  <span className="text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                    {change.body}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
