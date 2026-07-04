"use client";

import { createSupportTicket } from "@/actions/support";
import { useFeedbackStore } from "@/stores/feedback-store";
import {
  Button,
  Icon,
  Input,
  NativeSelect,
  Textarea,
  useToast,
} from "@madoo/design-system";
import type { MyWorkspace, SupportCategory } from "@madoo/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMe } from "@/actions/auth";
import posthog from "posthog-js";
import { getErrorMessage, SettingsCard } from "./settings-ui";

const supportCategoryOptions = [
  { value: "WORKSPACE", label: "Workspace" },
  { value: "BILLING", label: "Billing" },
  { value: "GENERATION", label: "Generation" },
  { value: "EXPORT", label: "Export" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
];

export function SupportPanel({
  activeWorkspace,
}: {
  activeWorkspace: MyWorkspace | null;
}) {
  const { toast } = useToast();
  const openFeedback = useFeedbackStore((s) => s.setOpen);
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });
  const [contactEmail, setContactEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("WORKSPACE");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState("");

  useEffect(() => {
    if (user?.email) setContactEmail(user.email);
  }, [user?.email]);

  const supportMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (ticket) => {
      posthog.capture("support_ticket_submitted", {
        ticket_id: ticket.id,
        category,
      });
      setTicketId(ticket.id);
      setSubject("");
      setMessage("");
      toast({ tone: "success", title: "Support request sent" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Support request failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  return (
    <SettingsCard description="Tell us what's going on — pick a category and we'll route it to the right place.">
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-madoo-bg-2 p-3.5 shadow-madoo-border">
          <div className="min-w-0">
            <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
              Quick feedback
            </p>
            <p className="mt-1.5 text-(length:--font-size-sm) leading-snug text-madoo-ink-muted">
              Just want to rate us or drop a quick note? Send feedback instead.
            </p>
          </div>
          <Button
            size="md"
            variant="secondary"
            className="shrink-0"
            onClick={() => openFeedback(true)}
          >
            Send feedback
          </Button>
        </div>
        {ticketId ? (
          <div className="flex items-start gap-2.5 rounded-lg bg-madoo-bg-2 p-3.5 shadow-madoo-border">
            <span className="mt-0.5 text-madoo-accent-deep" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                Request sent
              </p>
              <p className="mt-1.5 text-(length:--font-size-sm) leading-snug text-madoo-ink-muted">
                Ticket {ticketId} — we usually reply in the same day you talk to
                us.
              </p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Contact email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.currentTarget.value)}
          />
          <NativeSelect
            label="Category"
            value={category}
            options={supportCategoryOptions}
            onChange={(event) =>
              setCategory(event.currentTarget.value as SupportCategory)
            }
          />
        </div>
        <Input
          label="Subject"
          placeholder="Example: I cannot export a template"
          value={subject}
          onChange={(event) => setSubject(event.currentTarget.value)}
        />
        <Textarea
          label="What do you need help with?"
          placeholder="Share what happened, what you expected, and any project/template involved."
          rows={6}
          noResize
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-(length:--font-size-xs) text-madoo-ink-muted">
            We generally respond the same day you speak to us.
          </p>
          <Button
            size="md"
            disabled={
              supportMutation.isPending ||
              !contactEmail.trim() ||
              subject.trim().length < 3 ||
              message.trim().length < 10
            }
            onClick={() =>
              supportMutation.mutate({
                contactEmail: contactEmail.trim(),
                category,
                subject: subject.trim(),
                message: message.trim(),
                workspaceId: activeWorkspace?.id,
              })
            }
          >
            {supportMutation.isPending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
