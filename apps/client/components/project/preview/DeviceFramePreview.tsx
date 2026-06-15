"use client";

import { cn } from "@/lib/utils";
import { SegmentedControl } from "@madoo/design-system";
import { useState } from "react";

export type PreviewDevice = "desktop" | "phone";

const deviceItems = [
  { value: "desktop", label: "Desktop" },
  { value: "phone", label: "Phone" },
];

/**
 * Renders an email `srcDoc` at its real on-device size inside a realistic
 * desktop browser window or phone bezel. The email scrolls inside the frame
 * exactly as a recipient would see it. Used by the full-screen preview overlay
 * and the public share page.
 */
export function DeviceFramePreview({
  srcDoc,
  subject,
  addressLabel,
  className,
  device: controlledDevice,
  onDeviceChange,
  showToggle = true,
}: {
  srcDoc: string;
  subject?: string;
  addressLabel?: string;
  className?: string;
  device?: PreviewDevice;
  onDeviceChange?: (device: PreviewDevice) => void;
  showToggle?: boolean;
}) {
  const [internalDevice, setInternalDevice] =
    useState<PreviewDevice>("desktop");
  const device = controlledDevice ?? internalDevice;
  const setDevice = (next: PreviewDevice) => {
    setInternalDevice(next);
    onDeviceChange?.(next);
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {showToggle ? (
        <div className="flex shrink-0 items-center justify-center pb-4">
          <SegmentedControl
            aria-label="Preview device"
            className="rounded-lg bg-white/10 p-1 text-white shadow-none backdrop-blur"
            items={deviceItems}
            onChange={(value) => setDevice(value as PreviewDevice)}
            value={device}
          />
        </div>
      ) : null}

      <div className="madoo-preview-scrollbar flex min-h-0 flex-1 justify-center">
        {device === "desktop" ? (
          <div className="flex h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgb(0_0_0/0.45)]">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/5 bg-[#f3f4f6] px-4">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto inline-flex h-6 max-w-[60%] items-center truncate rounded-md bg-white px-3 text-xs text-[#6b7280] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]">
                {addressLabel ?? subject ?? "Email preview"}
              </span>
            </div>
            <iframe
              className="min-h-0 w-full flex-1 border-0 bg-white"
              sandbox=""
              srcDoc={srcDoc}
              title="Desktop email preview"
            />
          </div>
        ) : (
          <div className="flex h-full items-center py-2">
            <div className="relative flex h-[760px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[2.75rem] border-[10px] border-[#111317] bg-[#111317] shadow-[0_24px_70px_rgb(0_0_0/0.5)]">
              <span className="absolute left-1/2 top-2 z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-[#111317]" />
              <iframe
                className="h-full w-full rounded-[2rem] border-0 bg-white"
                sandbox=""
                srcDoc={srcDoc}
                title="Phone email preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
