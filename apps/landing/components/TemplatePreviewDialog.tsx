"use client";

import type { VariableSchemaRoot } from "@madoo/shared";
import { useEffect } from "react";

export type TemplatePreviewData = {
  id?: string;
  name: string;
  description: string;
  imageSrc?: string;
  authorName?: string | null;
  category?: string | null;
  variables?: VariableSchemaRoot["variables"];
};

export type TemplatePreviewCopy = {
  close: string;
  by: string;
  variables: string;
  noVariables: string;
  use: string;
  using: string;
  roleLabels: Record<string, string>;
};

export default function TemplatePreviewDialog({
  template,
  copy,
  isUsing,
  onClose,
  onUse,
}: {
  template: TemplatePreviewData | null;
  copy: TemplatePreviewCopy;
  isUsing: boolean;
  onClose: () => void;
  onUse: (template: TemplatePreviewData) => void;
}) {
  useEffect(() => {
    if (!template) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [template, onClose]);

  if (!template) return null;

  const variables = template.variables ?? [];

  return (
    <div
      className="font-ibm-plex-sans fixed inset-0 z-[200] flex items-center justify-center bg-madoo-blue-900/45 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={copy.close}
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-madoo-paper text-madoo-ink shadow-[0_28px_90px_rgb(7_17_35/0.28),0_0_0_1px_rgb(var(--madoo-rule-rgb)/0.12),inset_0_1px_0_rgb(255_255_255/0.92)]">
        <button
          type="button"
          className="absolute right-5 top-5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-madoo-paper/80 text-zinc-500 shadow-[0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.18)] backdrop-blur transition hover:bg-black/5 hover:text-zinc-900"
          aria-label={copy.close}
          onClick={onClose}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path
              d="m4.25 4.25 7.5 7.5m0-7.5-7.5 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="madoo-prompt-textarea max-h-[78vh] min-h-0 overflow-y-auto bg-madoo-neutral-50 p-4 md:max-h-[80vh]">
            {template.imageSrc ? (
              <img
                src={template.imageSrc}
                alt={template.name}
                className="w-full rounded-lg shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.16)]"
              />
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col border-t border-zinc-200 p-6 md:border-l md:border-t-0">
            <h2
              id="template-preview-title"
              className="m-0 text-lg font-semibold leading-tight text-madoo-ink"
            >
              {template.name}
            </h2>
            {template.authorName || template.category ? (
              <p className="mt-1 text-xs text-madoo-muted">
                {template.authorName
                  ? `${copy.by} ${template.authorName}`
                  : template.category}
              </p>
            ) : null}
            {template.description ? (
              <p className="mt-3 text-sm leading-6 text-madoo-copy">
                {template.description}
              </p>
            ) : null}

            <div className="mt-5 min-h-0 flex-1 overflow-hidden">
              <h3 className="m-0 text-xs font-medium uppercase tracking-wide text-madoo-muted">
                {copy.variables}
              </h3>
              <div className="madoo-prompt-textarea mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                {variables.length ? (
                  variables.map((variable) => (
                    <div
                      key={variable.name}
                      className="flex items-center justify-between gap-2 rounded-lg bg-madoo-neutral-50 px-3 py-2 shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.12)]"
                    >
                      <span className="min-w-0 truncate text-sm text-madoo-ink">
                        {variable.label ?? variable.name}
                      </span>
                      {variable.role ? (
                        <span className="shrink-0 rounded-md bg-madoo-paper px-2 py-0.5 text-[11px] font-medium text-madoo-muted shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.16)]">
                          {copy.roleLabels[variable.role] ?? variable.role}
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="m-0 rounded-lg bg-madoo-neutral-50 px-3 py-2 text-xs leading-5 text-madoo-muted shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.12)]">
                    {copy.noVariables}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isUsing}
              onClick={() => onUse(template)}
              className="mt-5 h-10 cursor-pointer rounded-lg bg-madoo-ink text-sm font-medium text-white shadow-[0_8px_20px_rgb(var(--madoo-ink-shadow-rgb)/0.16),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition hover:bg-madoo-ink-hover disabled:cursor-wait disabled:opacity-70"
            >
              {isUsing ? copy.using : copy.use}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
