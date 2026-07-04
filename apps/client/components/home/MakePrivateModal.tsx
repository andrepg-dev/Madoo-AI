import { Button, Modal } from "@madoo/design-system";
import type { CommunityTemplateDto } from "@madoo/shared";

export function MakePrivateModal({
  isPending,
  onClose,
  onConfirm,
  template,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  template: CommunityTemplateDto | null;
}) {
  return (
    <Modal
      footer={
        <>
          <Button
            disabled={isPending}
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            size="sm"
            variant="primary"
          >
            {isPending ? "Making private" : "Make private"}
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(template)}
      size="sm"
      title="Make template private"
    >
      <p className="m-0 text-sm leading-6 text-madoo-ink-muted">
        This removes{" "}
        <span className="font-medium text-madoo-ink">{template?.name}</span>{" "}
        from the public community gallery. Others will no longer be able to
        find, star, or use it, and its stars will be lost. Your original email
        stays in your workspace, and you can share it again later.
      </p>
    </Modal>
  );
}
