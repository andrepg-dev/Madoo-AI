"use client";

import { getMe } from "@/actions/auth";
import { sendTestEmail } from "@/actions/testing";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, useToast } from "@madoo/design-system";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type YourInboxPanelProps = {
  emailId: string | null;
  disabled: boolean;
};

export function YourInboxPanel({ disabled, emailId }: YourInboxPanelProps) {
  const { toast } = useToast();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [recipient, setRecipient] = useState("");
  const [dirty, setDirty] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (dirty || !meQuery.data?.email) return;
    setRecipient(meQuery.data.email);
  }, [dirty, meQuery.data?.email]);

  const handleSubmit = async () => {
    if (!emailId || disabled || sending) return;
    setSending(true);
    try {
      const result = await sendTestEmail(emailId, {
        to: recipient.trim() || undefined,
      });
      toast({
        tone: result.skipped ? "warn" : "success",
        title: result.skipped ? "Test email skipped" : "Test email sent",
        body: result.skipped
          ? "Resend is not configured in this environment."
          : `Sent to ${result.to}.`,
      });
    } catch (error) {
      toast({
        tone: "danger",
        title: "Could not send test email",
        body: error instanceof Error ? error.message : "Send failed.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-madoo-surface text-madoo-ink">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Mail01Icon}
            primaryColor="currentColor"
            size={19}
            strokeWidth={1.7}
          />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">
            Your Inbox
          </h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            Send a test email to yourself
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-madoo-ink-muted">
          Recipient
        </span>
        <input
          className="mt-2 h-10 w-full rounded-lg border-0 bg-white px-3 text-sm text-madoo-ink shadow-madoo-border outline-none transition-shadow placeholder:text-madoo-ink-faint focus:shadow-(--shadow-border-accent)"
          disabled={disabled || sending}
          onChange={(event) => {
            setDirty(true);
            setRecipient(event.target.value);
          }}
          placeholder="you@example.com"
          type="email"
          value={recipient}
        />
      </label>

      <Button
        className="bg-[#16a34a] text-white hover:bg-[#15803d]"
        disabled={disabled || sending}
        onClick={handleSubmit}
        type="button"
        variant="primary"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={Mail01Icon}
          primaryColor="currentColor"
          size={17}
          strokeWidth={1.7}
        />
        <span>{sending ? "Sending..." : "Send test"}</span>
      </Button>
    </section>
  );
}
