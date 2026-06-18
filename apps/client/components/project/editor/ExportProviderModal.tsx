import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, useToast } from "@madoo/design-system";
import type { ConnectionProvider } from "@madoo/shared";
import { createGmailDraft, createOutlookDraft, fetchConnections, getConnectionAuthorizeUrl } from "@/actions/connections";
import { AUTOMATION_INSTRUCTIONS, ESP_INSTRUCTIONS, ESP_NAME_TO_PROVIDER } from "@/lib/export-instructions";
import { applicationExportProviders, fileExportFormats } from "./constants";
import { openConnectPopup, triggerDownload } from "./utils";
import type { ExportTab } from "./types";
import { ExportFileCard } from "./ExportFileCard";
import { ExportProviderCard } from "./ExportProviderCard";
import { ExportTabButton } from "./ExportTabButton";
import posthog from "posthog-js";

export function ExportProviderModal({
  emailId,
  open,
  onClose,
  variantId,
}: {
  emailId: string | null;
  open: boolean;
  onClose: () => void;
  variantId: string | null;
}) {
  const [tab, setTab] = useState<ExportTab>("file");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["connections"],
    queryFn: fetchConnections,
    enabled: open,
  });
  const isConnected = (provider: ConnectionProvider) =>
    connectionsQuery.data?.some((c) => c.provider === provider) ?? false;

  const variantQuery = variantId
    ? `&variantId=${encodeURIComponent(variantId)}`
    : "";

  const requireEmail = (): string | null => {
    if (!emailId) {
      toast({
        tone: "danger",
        title: "No email yet",
        body: "Generate an email before exporting.",
      });
      return null;
    }
    return emailId;
  };

  const downloadFile = (kind: string, extraQuery = "") => {
    const id = requireEmail();
    if (!id) return;
    posthog.capture("email_exported", {
      email_id: id,
      export_type: "file",
      file_kind: kind,
    });
    triggerDownload(
      `/api/export/emails/${id}/export/${kind}?${extraQuery}${variantQuery}`.replace(
        "?&",
        "?",
      ),
    );
  };

  const handleEsp = (displayName: string) => {
    const provider = ESP_NAME_TO_PROVIDER[displayName];
    if (!provider) return;
    const id = requireEmail();
    if (!id) return;
    posthog.capture("email_exported", {
      email_id: id,
      export_type: "esp",
      provider,
      provider_name: displayName,
    });
    triggerDownload(
      `/api/export/emails/${id}/export/esp?provider=${provider}${variantQuery}`,
    );
    toast({
      tone: "success",
      title: `${displayName} HTML downloaded`,
      body: ESP_INSTRUCTIONS[provider].join(" "),
    });
  };

  const handlePayload = (displayName: string) => {
    const id = requireEmail();
    if (!id) return;
    triggerDownload(
      `/api/export/emails/${id}/export/payload?${variantQuery}`.replace("?&", "?"),
    );
    const steps = AUTOMATION_INSTRUCTIONS[displayName];
    toast({
      tone: "success",
      title: `${displayName} payload downloaded`,
      body: steps ? steps.join(" ") : "JSON payload downloaded.",
    });
  };

  const ensureConnected = async (
    provider: ConnectionProvider,
  ): Promise<boolean> => {
    if (isConnected(provider)) return true;
    const { url } = await getConnectionAuthorizeUrl(provider);
    const result = await openConnectPopup(provider, url);
    if (!result.ok) {
      toast({
        tone: "danger",
        title: "Connection failed",
        body: result.message ?? "Could not connect the account.",
      });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["connections"] });
    return true;
  };

  const handleDraft = async (
    displayName: string,
    provider: ConnectionProvider,
  ) => {
    const id = requireEmail();
    if (!id) return;
    setBusyKey(displayName);
    try {
      const ok = await ensureConnected(provider);
      if (!ok) return;
      const result =
        provider === "gmail"
          ? await createGmailDraft(id, variantId ?? undefined)
          : await createOutlookDraft(id, variantId ?? undefined);
      posthog.capture("email_exported", {
        email_id: id,
        export_type: "draft",
        provider,
        provider_name: displayName,
      });
      window.open(result.openUrl, "_blank", "noopener");
      toast({
        tone: "success",
        title: `${displayName} draft created`,
        body: "Opened your drafts in a new tab to review and send.",
      });
    } catch (error) {
      posthog.captureException(error);
      toast({
        tone: "danger",
        title: `${displayName} export failed`,
        body:
          error instanceof Error ? error.message : "Could not create the draft.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleApplication = (displayName: string) => {
    if (displayName === "Gmail") return handleDraft("Gmail", "gmail");
    if (displayName === "Outlook App" || displayName === "Outlook Web") {
      return handleDraft(displayName, "outlook");
    }
    return handlePayload(displayName);
  };

  return (
    <Modal
      className="bg-madoo-bg"
      description="Choose where this generated email should go next."
      eyebrow="Export"
      onClose={onClose}
      open={open}
      size="lg"
      title="Export email"
    >
      <div className="space-y-4">
        <div className="flex w-fit items-center rounded-xl bg-madoo-surface-2 p-1">
          {/* Providers export is hidden until ESP integrations are available.
          <ExportTabButton active={tab === "email"} onClick={() => setTab("email")}>
            Providers
          </ExportTabButton>
          */}
          <ExportTabButton
            active={tab === "application"}
            onClick={() => setTab("application")}
          >
            Application
          </ExportTabButton>
          <ExportTabButton active={tab === "file"} onClick={() => setTab("file")}>
            File
          </ExportTabButton>
        </div>

        <div className="grid max-h-90 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {/* Providers export is hidden until ESP integrations are available.
          {tab === "email"
            ? emailExportProviders.map((provider) => (
                <ExportProviderCard
                  iconSrc={provider.iconSrc}
                  key={provider.name}
                  name={provider.name}
                  onClick={() => handleEsp(provider.name)}
                />
              ))
            : null}
          */}

          {tab === "application"
            ? applicationExportProviders.map((provider) => (
              <ExportProviderCard
                badge={provider.badge}
                busy={busyKey === provider.name}
                iconSrc={provider.iconSrc}
                key={provider.name}
                name={provider.name}
                onClick={() => handleApplication(provider.name)}
              />
            ))
            : null}

          {tab === "file"
            ? fileExportFormats.map((format) => {
              const onClick =
                format.name === "HTML"
                  ? () => downloadFile("html")
                  : format.name === "Image"
                    ? () => downloadFile("image", "format=png")
                    : () => downloadFile("pdf");
              return (
                <ExportFileCard
                  description={format.description}
                  icon={format.icon}
                  key={format.name}
                  name={format.name}
                  onClick={onClick}
                />
              );
            })
            : null}
        </div>
      </div>
    </Modal>
  );
}
