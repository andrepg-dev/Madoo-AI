"use client";

import {
  updateEmailVariantVariableSchema,
  uploadEmailImage,
} from "@/actions/emails";
import { cn } from "@/lib/utils";
import {
  Cancel01Icon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button, Input, useToast } from "@madoo/design-system";
import type {
  EmailDto,
  VariableSchemaRoot,
  VariableSpec,
} from "@madoo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type VariableScope = "dynamic" | "static";

const VALUE_SAVE_DEBOUNCE_MS = 600;

type VariablesPanelProps = {
  emailId: string;
  variantId: string;
  variables: VariableSpec[];
  onClose: () => void;
};

const roleLabels: Record<NonNullable<VariableSpec["role"]>, string> = {
  text: "Text",
  url: "URL",
  image: "Image",
  date: "Date",
};

function inputTypeForRole(role: VariableSpec["role"]): string {
  if (role === "url" || role === "image") return "url";
  if (role === "date") return "date";
  return "text";
}

function defaultScope(variable: VariableSpec): VariableScope {
  return variable.scope ?? "dynamic";
}

export function VariablesPanel({
  emailId,
  variantId,
  variables,
  onClose,
}: VariablesPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Local draft is the source of truth while the panel is open; the parent keys
  // this component by variant id, so it re-initializes when the variant changes.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, v.default])),
  );
  const [scopes, setScopes] = useState<Record<string, VariableScope>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, defaultScope(v)])),
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Briefly surface a "Saved" indicator after each successful persist.
  useEffect(() => {
    if (savedAt === null) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1800);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const valueOf = (variable: VariableSpec) =>
    values[variable.name] ?? variable.default;
  const scopeOf = (variable: VariableSpec): VariableScope =>
    scopes[variable.name] ?? defaultScope(variable);

  const buildSchema = (
    nextValues: Record<string, string>,
    nextScopes: Record<string, VariableScope>,
  ): VariableSchemaRoot => ({
    variables: variables.map((variable) => ({
      ...variable,
      default: nextValues[variable.name] ?? variable.default,
      scope: nextScopes[variable.name] ?? defaultScope(variable),
    })),
  });

  const mutation = useMutation({
    mutationFn: (schema: VariableSchemaRoot) =>
      updateEmailVariantVariableSchema(emailId, variantId, {
        variableSchema: schema,
      }),
    onSuccess: (email: EmailDto) => {
      queryClient.setQueryData(["email", emailId], email);
      setSavedAt(Date.now());
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not save variables",
        body: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  // Latest scopes for the debounced value save, so it never persists a stale
  // scope if the user flips one mid-edit.
  const scopesRef = useRef(scopes);
  scopesRef.current = scopes;
  const saveTimer = useRef<number | null>(null);
  const cancelPendingSave = () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
  };
  useEffect(() => cancelPendingSave, []);

  // Scope (dynamic/static) flips optimistically and persists in the background —
  // the UI never waits on the backend. Revert if the save fails.
  const handleScopeChange = (name: string, scope: VariableScope) => {
    cancelPendingSave();
    const prevScopes = scopes;
    const nextScopes = { ...scopes, [name]: scope };
    setScopes(nextScopes);
    mutation.mutate(buildSchema(values, nextScopes), {
      onError: () => setScopes(prevScopes),
    });
  };

  // Value edits persist automatically, debounced — no save button.
  const handleValueChange = (name: string, value: string) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    cancelPendingSave();
    saveTimer.current = window.setTimeout(() => {
      mutation.mutate(buildSchema(nextValues, scopesRef.current));
    }, VALUE_SAVE_DEBOUNCE_MS);
  };

  // Discrete value changes (e.g. an uploaded image URL) persist immediately.
  const persistValue = (name: string, value: string) => {
    cancelPendingSave();
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    mutation.mutate(buildSchema(nextValues, scopesRef.current));
  };

  return (
    <aside
      aria-label="Email variables"
      className="flex h-full w-72 shrink-0 flex-col bg-madoo-bg shadow-[inset_-1px_0_0_rgb(var(--rule-rgb)/0.12)]"
    >
      <header className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-madoo-ink">Variables</h3>
            <SaveStatus pending={mutation.isPending} saved={savedAt !== null} />
          </div>
          <p className="mt-1 text-xs leading-5 text-madoo-ink-muted">
            Edit values and switch each between dynamic and static.
          </p>
        </div>
        <Button
          aria-label="Close variables panel"
          className="size-7 shrink-0 rounded-lg p-0!"
          onClick={onClose}
          size="sm"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={Cancel01Icon}
            primaryColor="currentColor"
            size={15}
            strokeWidth={1.7}
          />
        </Button>
      </header>

      <div className="madoo-preview-scrollbar mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {variables.length === 0 ? (
          <p className="rounded-lg bg-madoo-surface p-3 text-xs leading-5 text-madoo-ink-muted shadow-madoo-border">
            This email has no editable variables.
          </p>
        ) : (
          variables.map((variable) => {
            const scope = scopeOf(variable);
            return (
              <div
                className="rounded-lg bg-madoo-surface p-3 shadow-madoo-border"
                key={variable.name}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-medium text-madoo-ink">
                    {variable.label ?? variable.name}
                  </span>
                  {variable.role ? (
                    <Badge tone="neutral">{roleLabels[variable.role]}</Badge>
                  ) : null}
                </div>

                {scope !== "static" ? (
                  <p className="mt-2 truncate rounded-lg bg-madoo-accent-soft px-2.5 py-1.5 font-madoo-mono text-xs text-madoo-accent-deep">
                    {`{{${variable.name}}}`}
                  </p>
                ) : variable.role === "image" ? (
                  <ImageUploader
                    emailId={emailId}
                    onUploaded={(url) => persistValue(variable.name, url)}
                    value={valueOf(variable)}
                  />
                ) : (
                  <Input
                    className="mt-2"
                    inputSize="sm"
                    onChange={(event) =>
                      handleValueChange(variable.name, event.target.value)
                    }
                    placeholder="Value"
                    type={inputTypeForRole(variable.role)}
                    value={valueOf(variable)}
                  />
                )}

                <ScopeToggle
                  onChange={(next) => handleScopeChange(variable.name, next)}
                  value={scope}
                />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ImageUploader({
  emailId,
  onUploaded,
  value,
}: {
  emailId: string;
  onUploaded: (url: string) => void;
  value: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = /^https?:\/\//i.test(value);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ tone: "danger", title: "Not an image", body: "Pick an image file." });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      onUploaded(await uploadEmailImage(emailId, form));
    } catch (error) {
      toast({
        tone: "danger",
        title: "Upload failed",
        body: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "mt-2 flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-madoo-bg-2 p-2 text-center shadow-madoo-border transition-shadow",
        dragOver && "shadow-(--shadow-border-accent)",
      )}
      onClick={() => inputRef.current?.click()}
      onDragLeave={() => setDragOver(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        void upload(event.dataTransfer.files?.[0]);
      }}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Variable"
          className="max-h-28 w-full rounded-md object-contain"
          src={value}
        />
      ) : null}
      <span className="inline-flex items-center gap-1.5 text-[11px] text-madoo-ink-muted">
        {uploading ? (
          <>
            <HugeiconsIcon
              aria-hidden="true"
              className="animate-spin"
              icon={Loading03Icon}
              primaryColor="currentColor"
              size={12}
              strokeWidth={2.2}
            />
            Uploading…
          </>
        ) : hasImage ? (
          "Drag a new image to replace"
        ) : (
          "Drag & drop or click to upload"
        )}
      </span>
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}

function SaveStatus({ pending, saved }: { pending: boolean; saved: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-madoo-ink-muted">
        <HugeiconsIcon
          aria-hidden="true"
          className="animate-spin"
          icon={Loading03Icon}
          primaryColor="currentColor"
          size={12}
          strokeWidth={2.2}
        />
        Saving…
      </span>
    );
  }
  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
        <HugeiconsIcon
          aria-hidden="true"
          icon={Tick02Icon}
          primaryColor="currentColor"
          size={12}
          strokeWidth={2.2}
        />
        Saved
      </span>
    );
  }
  return null;
}

function ScopeToggle({
  onChange,
  value,
}: {
  onChange: (scope: VariableScope) => void;
  value: VariableScope;
}) {
  const scopes: VariableScope[] = ["dynamic", "static"];
  return (
    <div className="mt-2 flex gap-1 rounded-lg bg-madoo-bg-2 p-1">
      {scopes.map((scope) => (
        <button
          aria-pressed={value === scope}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors",
            value === scope
              ? "bg-white text-madoo-ink shadow-madoo-border"
              : "text-madoo-ink-muted hover:text-madoo-ink",
          )}
          key={scope}
          onClick={() => onChange(scope)}
          type="button"
        >
          {scope}
        </button>
      ))}
    </div>
  );
}
