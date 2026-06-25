"use client";

import { createFeedback } from "@/actions/feedback";
import { useFeedbackStore } from "@/stores/feedback-store";
import { Button, Icon, Modal, Textarea, cx, useToast } from "@madoo/design-system";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const RATINGS = [1, 2, 3, 4, 5] as const;
const SENT_KEY = "madoo.feedback.sent";

export function FeedbackWidget() {
  const open = useFeedbackStore((s) => s.open);
  const setOpen = useFeedbackStore((s) => s.setOpen);
  const pathname = usePathname();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  // Once the user has sent feedback, hide the floating bubble so it stops
  // nagging. They can still reopen it from Settings → Support. Persisted so it
  // stays hidden across reloads; read after mount to avoid hydration mismatch.
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSent(localStorage.getItem(SENT_KEY) === "1");
  }, []);

  function reset() {
    setRating(0);
    setHovered(0);
    setMessage("");
  }

  function close() {
    setOpen(false);
    reset();
  }

  function submit() {
    if (rating < 1) {
      toast({ tone: "danger", title: "Pick a rating first" });
      return;
    }
    if (message.trim().length < 1) {
      toast({ tone: "danger", title: "Add a short message" });
      return;
    }
    const payload = {
      rating,
      message: message.trim(),
      page: pathname ?? undefined,
    };
    // Close immediately so the bubble dismisses the moment they send; the
    // request finishes in the background and only surfaces on failure.
    close();
    setSent(true);
    localStorage.setItem(SENT_KEY, "1");
    toast({ tone: "success", title: "Thanks for the feedback!" });
    createFeedback(payload).catch((error) => {
      toast({
        tone: "danger",
        title: "Could not send feedback",
        body: error instanceof Error ? error.message : undefined,
      });
    });
  }

  return (
    <>
      {!sent ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-4 right-4 z-[var(--z-modal)] hidden items-center gap-2 rounded-full bg-madoo-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-madoo-ink-hover md:inline-flex"
        >
          <Icon name="message" size={16} />
          Feedback
        </button>
      ) : null}

      <Modal
        open={open}
        onClose={close}
        title="Send feedback"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={close}>
              Cancel
            </Button>
            <Button size="md" onClick={submit}>
              Send
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-madoo-muted">How are we doing?</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {RATINGS.map((value) => {
                const active = value <= (hovered || rating);
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHovered(value)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(value)}
                    className={cx(
                      "transition",
                      active ? "text-yellow-400" : "text-madoo-border",
                    )}
                  >
                    <Icon name="star" size={28} />
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            placeholder="Tell us what's working or what we could improve…"
            rows={4}
            maxLength={2000}
          />
        </div>
      </Modal>
    </>
  );
}
