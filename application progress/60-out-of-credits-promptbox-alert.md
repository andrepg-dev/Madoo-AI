---
date: 2026-06-13
area: client (prompt box, billing, pricing drawer)
files:
  - apps/client/stores/client-store.ts
  - apps/client/components/home/ClientPromptBox.tsx
  - apps/client/components/shell/Sidebar.tsx
  - apps/client/app/email-template-project/page.tsx
---

# Out-of-credits alert on the client prompt box

When a workspace has used all its AI credits, the prompt box (`ClientPromptBox`)
now shows a dismissible alert directly above the input, on both the home prompt
and the in-project chat variant.

## What it does

- Alert text: "Out of credits." + an inline **Upgrade plan** link + "to keep
  generating."
- **Upgrade plan** opens the `PricingDrawer`.
- A ghost-variant `Button` with a Hugeicons `Cancel01Icon` ("X") on the right
  dismisses the alert.

## Design (design.md)

Compact single-line row, not a tall card. Uses the design-system `Banner` token
language — `bg-madoo-warn-soft` + `text-madoo-warn` (amber "warn" tone) — with a
`shadow-madoo-border` ring (the only shadow design.md permits) instead of a hard
border. Built as a composed row rather than the `Banner` component itself because
`Banner` has no dismiss-button slot and its `cx` helper does not tailwind-merge,
so its fixed icon-chip / `items-start` layout can't be safely overridden for a
compact centered row. Icon is Hugeicons `Alert02Icon`; the X reuses the DS
`Button` (`variant="ghost"`).

## How out-of-credits is detected

`ClientPromptBox` fetches `fetchBillingOverview` via React Query
(`queryKey: ["billing-overview", workspaceId]`, enabled when a user is present —
shares cache with `Sidebar`). Out of credits when
`usage.aiGenerations.limit !== -1 && used >= limit` (`-1` = unlimited plan, never
alerts).

Dismissal is local state (`creditsAlertDismissed`). It auto-resets whenever the
workspace is no longer out of credits, so the alert re-surfaces if they run out
again (e.g. after switching workspaces or a reset).

## Pricing drawer moved to the global store

The **Upgrade plan** link lives in the shared prompt box, which has no local
`PricingDrawer`. So `pricingOpen` / `setPricingOpen` moved from local `useState`
into `useClientStore` (alongside `sidebarOpen`). Wiring:

- `client-store.ts`: added `pricingOpen` + `setPricingOpen`.
- `Sidebar.tsx`: reads `pricingOpen`/`setPricingOpen` from the store instead of
  local state (its "Upgrade to Pro" button + its `PricingDrawer`).
- `email-template-project/page.tsx`: same swap (its `PricingDrawer` +
  `EmailPreviewSidebar` `onOpenPricing`).

Safe because each route renders exactly one `PricingDrawer`: the home/root layout
gets it via `ClientShell` → `Sidebar`; the email project route has its own and no
`Sidebar` (its `layout.tsx` is a passthrough). No double-render against the shared
state.

## Verify

`npx tsc --noEmit -p apps/client/tsconfig.json` passes clean.
