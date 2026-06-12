"use client";

import { createWorkspace, setActiveWorkspace } from "@/actions/workspaces";
import { useClientStore } from "@/stores/client-store";
import { Button, Input, Modal, useToast } from "@madoo/design-system";
import type { MyWorkspace } from "@madoo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CreateWorkspaceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [workspaceName, setWorkspaceName] = useState("");
  const queryClient = useQueryClient();
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);
  const { toast } = useToast();
  const trimmedName = workspaceName.trim();

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const workspace = await createWorkspace({ name });
      await setActiveWorkspace(workspace.id);
      return workspace;
    },
    onSuccess: async (workspace) => {
      setWorkspaceId(workspace.id);
      queryClient.setQueryData<MyWorkspace[]>(
        ["workspaces"],
        (current = []) => {
          if (current.some((item) => item.id === workspace.id)) {
            return current;
          }
          return [...current, workspace];
        },
      );
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
      toast({
        tone: "success",
        title: "Workspace created",
        body: `${workspace.name} is now active.`,
      });
      setWorkspaceName("");
      onClose();
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Workspace not created",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const onContinue = () => {
    if (!trimmedName) {
      toast({
        tone: "warn",
        title: "Workspace name required",
        body: "Add a workspace name before continuing.",
      });
      return;
    }

    createMutation.mutate(trimmedName);
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
          <Button
            size="md"
            variant="secondary"
            disabled={createMutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="md"
            disabled={createMutation.isPending}
            onClick={onContinue}
          >
            {createMutation.isPending ? "Creating" : "Create"}
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
          if (event.key === "Enter" && !createMutation.isPending) onContinue();
        }}
      />
    </Modal>
  );
}
