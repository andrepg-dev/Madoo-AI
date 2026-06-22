"use client";

import { fetchMyReferral } from "@/actions/referrals";
import { Button, Icon, Input, Modal, useToast } from "@madoo/design-system";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function ReferralInviteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-referral"],
    queryFn: fetchMyReferral,
    staleTime: 60_000,
    enabled: open,
  });

  const referralUrl = data?.url ?? "";

  const commitDraft = () => {
    const parsed = parseEmails(draft);
    if (parsed.length === 0) return;
    const invalid = parsed.filter((email) => !EMAIL_RE.test(email));
    if (invalid.length > 0) {
      toast({
        tone: "danger",
        title: "Invalid email",
        body: invalid.join(", "),
      });
    }
    const valid = parsed.filter((email) => EMAIL_RE.test(email));
    if (valid.length > 0) {
      setEmails((prev) => Array.from(new Set([...prev, ...valid])));
    }
    setDraft("");
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((value) => value !== email));
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({ tone: "success", title: "Referral link copied" });
    } catch {
      toast({ tone: "danger", title: "Couldn't copy link" });
    }
  };

  const sendInvites = () => {
    // Fold any half-typed address in before building the mail.
    const pending = parseEmails(draft).filter((email) => EMAIL_RE.test(email));
    const recipients = Array.from(new Set([...emails, ...pending]));
    if (recipients.length === 0) {
      toast({
        tone: "danger",
        title: "Add at least one email",
        body: "Type the people you want to invite.",
      });
      return;
    }
    if (!referralUrl) return;

    const subject = encodeURIComponent("Try Madoo AI with me");
    const body = encodeURIComponent(
      `I'm using Madoo AI to design email templates with AI — thought you'd like it.\n\nSign up with my link:\n${referralUrl}\n`,
    );
    // BCC so invitees don't see each other; opens the user's own mail client.
    window.location.href = `mailto:?bcc=${encodeURIComponent(
      recipients.join(","),
    )}&subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Invite people to Madoo"
      description={
        data
          ? `Earn ${new Intl.NumberFormat().format(
              data.rewardPerReferral,
            )} credits when someone you invite subscribes to a paid plan.`
          : "Share your link and earn credits when invitees subscribe."
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => void copyLink()}>
            Copy link
          </Button>
          <Button onClick={sendInvites} disabled={isLoading || !referralUrl}>
            Send invites
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Input
            label="Who do you want to invite?"
            placeholder="name@example.com, another@example.com"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitDraft();
              }
            }}
            onBlur={commitDraft}
          />
          {emails.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 rounded-full bg-madoo-bg-2 px-2.5 py-1 text-(length:--font-size-sm) text-madoo-ink shadow-madoo-border"
                >
                  {email}
                  <button
                    type="button"
                    aria-label={`Remove ${email}`}
                    className="grid place-items-center text-madoo-ink-muted hover:text-madoo-ink"
                    onClick={() => removeEmail(email)}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <span className="text-(length:--font-size-sm) font-medium text-madoo-ink">
            Your referral link
          </span>
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-madoo-bg-2 p-3 shadow-madoo-border">
            <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-madoo-ink-muted">
              {isLoading ? "Loading…" : referralUrl}
            </code>
            <Button
              size="sm"
              variant="secondary"
              disabled={!referralUrl}
              onClick={() => void copyLink()}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
