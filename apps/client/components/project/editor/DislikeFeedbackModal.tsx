import { useEffect, useState } from "react";
import { Button, Modal, Textarea } from "@madoo/design-system";

export function DislikeFeedbackModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  return (
    <Modal
      className="bg-madoo-bg"
      description="Tell us what went wrong so we can improve future responses."
      eyebrow="Feedback"
      onClose={onClose}
      open={open}
      size="md"
      title="Help us improve this response"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            Skip
          </Button>
          <Button onClick={() => onSubmit(comment.trim())} variant="primary">
            Send feedback
          </Button>
        </div>
      }
    >
      <Textarea
        autoFocus
        onChange={(e) => setComment(e.target.value)}
        placeholder="What would you have liked instead?"
        rows={4}
        value={comment}
      />
    </Modal>
  );
}
