"use client";

import { Button, Input, Modal, useToast } from "@madoo/design-system";
import { useState } from "react";

export function CreateWorkspaceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [workspaceName, setWorkspaceName] = useState("");
  const { toast } = useToast();
  const trimmedName = workspaceName.trim();

  const onContinue = () => {
    if (!trimmedName) {
      toast({
        tone: "warn",
        title: "Workspace name required",
        body: "Add a workspace name before continuing.",
      });
      return;
    }

    toast({
      tone: "success",
      title: "Workspace ready",
      body: `${trimmedName} can be created when backend wiring is connected.`,
    });
    setWorkspaceName("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Workspace"
      title="Create workspace"
      description="Name the workspace that will contain projects, templates, members, and billing."
      footer={
        <>
          <Button size="md" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={onContinue}>
            Continue
          </Button>
        </>
      }
    >
      <Input
        autoFocus
        label="Workspace name"
        placeholder="Example: Madoo Marketing"
        value={workspaceName}
        onChange={(event) => setWorkspaceName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onContinue();
        }}
      />
    </Modal>
  );
}
