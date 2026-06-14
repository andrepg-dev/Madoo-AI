"use client";

import { updateEmailVariantVariableSchema } from "@/actions/emails";
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
import { useEffect, useMemo, useState } from "react";

type VariableScope = "dynamic" | "static";

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

  // Scope (dynamic/static) flips optimistically and persists in the background —
  // the UI never waits on the backend. Revert if the save fails.
  const handleScopeChange = (name: string, scope: VariableScope) => {
    const prevScopes = scopes;
    const nextScopes = { ...scopes, [name]: scope };
    setScopes(nextScopes);
    mutation.mutate(buildSchema(values, nextScopes), {
      onError: () => setScopes(prevScopes),
    });
  };

  // Value edits are batched behind an explicit save (avoids a request per key).
  const valuesDirty = useMemo(
    () => variables.some((variable) => valueOf(variable) !== variable.default),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variables, values],
  );

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

                <Input
                  className="mt-2"
                  inputSize="sm"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [variable.name]: event.target.value,
                    }))
                  }
                  placeholder="Value"
                  type={inputTypeForRole(variable.role)}
                  value={valueOf(variable)}
                />

                <ScopeToggle
                  onChange={(next) => handleScopeChange(variable.name, next)}
                  value={scope}
                />
              </div>
            );
          })
        )}
      </div>

      {valuesDirty ? (
        <div className="flex items-center gap-2 px-4 py-3 shadow-[inset_0_1px_0_rgb(var(--rule-rgb)/0.12)]">
          <Button
            block
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(buildSchema(values, scopes))}
            size="md"
            type="button"
            variant="primary"
          >
            {mutation.isPending ? "Saving…" : "Save & update preview"}
          </Button>
        </div>
      ) : null}
    </aside>
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
