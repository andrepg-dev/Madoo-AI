"use client";

import { Button, Modal } from "@madoo/design-system";

export const TEMPLATE_CREATION_REASON_OPTIONS = [
  {
    value: "save_time",
    label: "Save time",
    description: "Create emails faster.",
  },
  {
    value: "better_results",
    label: "Better results",
    description: "Improve quality and consistency.",
  },
  {
    value: "fair_pricing",
    label: "Fair pricing",
    description: "Need useful tools at a sensible cost.",
  },
  {
    value: "small_team",
    label: "Small team",
    description: "Need something simple without extra setup.",
  },
  {
    value: "less_manual_work",
    label: "Less manual work",
    description: "Avoid copying, pasting, and formatting.",
  },
  {
    value: "just_exploring",
    label: "Just exploring",
    description: "Trying AI templates before deciding.",
  },
] as const;

type Props = {
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  onSkip: () => void;
};

export function TemplateReasonModal({
  open,
  pending = false,
  onClose,
  onSelect,
  onSkip,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      size="sm"
      title="What brought you here?"
      description="One quick answer helps us tune templates, pricing, and onboarding."
      footer={
        <Button variant="ghost" size="sm" disabled={pending} onClick={onSkip}>
          Skip
        </Button>
      }
    >
      <div style={{ display: "grid", gap: 8 }}>
        {TEMPLATE_CREATION_REASON_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending}
            onClick={() => onSelect(option.value)}
            style={{
              width: "100%",
              textAlign: "left",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--ink)",
              padding: "11px 12px",
              cursor: pending ? "default" : "pointer",
            }}
          >
            <span style={{ display: "block", fontSize: 13, fontWeight: 650 }}>
              {option.label}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 12,
                color: "var(--ink-soft)",
                lineHeight: 1.35,
              }}
            >
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
