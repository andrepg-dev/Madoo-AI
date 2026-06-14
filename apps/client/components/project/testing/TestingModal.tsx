"use client";

import { SegmentedControl, Modal } from "@madoo/design-system";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { LinksPanel } from "./LinksPanel";
import { SpamPanel } from "./SpamPanel";
import { YourInboxPanel } from "./YourInboxPanel";
import { useState } from "react";

type TestingTab = "inbox" | "accessibility" | "links" | "spam";

const tabItems = [
  { value: "inbox", label: "Your Inbox" },
  { value: "accessibility", label: "Accessibility" },
  { value: "links", label: "Links" },
  { value: "spam", label: "Spam" },
];

type TestingModalProps = {
  emailId: string | null;
  html: string;
  onClose: () => void;
  open: boolean;
  variantId: string | null;
};

export function TestingModal({
  emailId,
  html,
  onClose,
  open,
  variantId,
}: TestingModalProps) {
  const [tab, setTab] = useState<TestingTab>("accessibility");
  const disabled = !emailId || !variantId;

  return (
    <Modal
      className="bg-madoo-bg"
      onClose={onClose}
      open={open}
      size="xl"
      title="Testing Email Message"
    >
      <div className="space-y-5">
        <SegmentedControl
          aria-label="Testing tabs"
          className="max-w-full shadow-none"
          items={tabItems}
          onChange={(value) => setTab(value as TestingTab)}
          value={tab}
        />

        {disabled ? (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-madoo-border">
            Generate an email before running tests.
          </div>
        ) : null}

        {tab === "inbox" ? (
          <YourInboxPanel disabled={disabled} emailId={emailId} />
        ) : null}
        {tab === "accessibility" ? (
          <AccessibilityPanel disabled={disabled} html={html} />
        ) : null}
        {tab === "links" ? (
          <LinksPanel disabled={disabled} emailId={emailId} />
        ) : null}
        {tab === "spam" ? (
          <SpamPanel disabled={disabled} emailId={emailId} />
        ) : null}
      </div>
    </Modal>
  );
}
