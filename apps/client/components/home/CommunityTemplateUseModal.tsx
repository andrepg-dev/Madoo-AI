"use client";

import type {
  CommunityTemplateDetailDto,
  CommunityTemplateDto,
  ShareEmailToCommunityInput,
} from "@/actions/community-templates";
import EmailPreviewFrame from "@/components/global/email-preview-frame";
import {
  Button,
  Input,
  Modal,
  Select,
  Textarea,
  cx,
} from "@madoo/design-system";
import {
  COMMUNITY_TEMPLATE_CATEGORIES,
  COMMUNITY_TEMPLATE_MAX_CATEGORIES,
  type CommunityTemplateCategory,
  type EmailDto,
  type VariableSchemaRoot,
  type VariableSpec,
} from "@madoo/shared";
import { useEffect, useMemo, useState } from "react";

import {
  cloneSchema,
  defaultScope,
  getEmailTitle,
  inputTypeForRole,
  roleLabels,
  suggestCommunityCategories,
  toggleCategorySelection,
} from "./show-case-utils";

function ScopeToggle({
  onChange,
  value,
}: {
  onChange: (scope: "dynamic" | "static") => void;
  value: "dynamic" | "static";
}) {
  const scopes: Array<"dynamic" | "static"> = ["dynamic", "static"];

  return (
    <div className="mt-2 flex gap-1 rounded-lg bg-madoo-bg-2 p-1">
      {scopes.map((scope) => (
        <button
          aria-pressed={value === scope}
          className={cx(
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

export function CommunityTemplateUseModal({
  detail,
  fallback,
  isLoading,
  isPending,
  onClose,
  onUse,
  open,
}: {
  detail: CommunityTemplateDetailDto | null;
  fallback: CommunityTemplateDto | null;
  isLoading: boolean;
  isPending: boolean;
  onClose: () => void;
  onUse: (id: string, variableSchema: VariableSchemaRoot) => void;
  open: boolean;
}) {
  const [draft, setDraft] = useState<VariableSchemaRoot>({ variables: [] });
  const activeTemplate = detail ?? fallback;

  useEffect(() => {
    if (detail) setDraft(cloneSchema(detail.variableSchema));
  }, [detail]);

  const updateVariable = (
    name: string,
    patch: Partial<Pick<VariableSpec, "default" | "scope">>,
  ) => {
    setDraft((current) => ({
      variables: current.variables.map((variable) =>
        variable.name === name ? { ...variable, ...patch } : variable,
      ),
    }));
  };

  const useTemplate = () => {
    if (!detail) return;
    onUse(detail.id, draft);
  };

  return (
    <Modal
      footer={
        <>
          <Button onClick={onClose} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!detail || isPending}
            onClick={useTemplate}
            size="sm"
            variant="primary"
          >
            {isPending ? "Creating" : "Use template"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="xxl"
      title={activeTemplate?.name ?? "Community template"}
    >
      {isLoading ? (
        <div className="grid min-h-100 place-items-center text-sm text-madoo-ink-muted">
          Loading template
        </div>
      ) : detail ? (
        <div className="grid grid-cols-[minmax(220px,300px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
          <section className="min-h-0 rounded-lg bg-white p-3 shadow-madoo-border">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-medium text-madoo-ink">
                Variables
              </h3>
            </div>
            {detail.categories.length ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {detail.categories.map((category) => (
                  <span
                    className="rounded-md bg-madoo-bg-2 px-2 py-1 text-[11px] font-medium text-madoo-ink-muted"
                    key={category}
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="madoo-preview-scrollbar max-h-[78vh] space-y-3 overflow-y-auto pr-1">
              {draft.variables.length ? (
                draft.variables.map((variable) => {
                  const scope = defaultScope(variable);
                  return (
                    <div
                      className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border"
                      key={variable.name}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-madoo-ink">
                          {variable.label ?? variable.name}
                        </span>
                        {variable.role ? (
                          <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-madoo-ink-muted shadow-madoo-border">
                            {roleLabels[variable.role]}
                          </span>
                        ) : null}
                      </div>

                      {scope === "dynamic" ? (
                        <p className="mt-2 truncate rounded-lg bg-madoo-accent-soft px-2.5 py-1.5 font-madoo-mono text-xs text-madoo-accent-deep">
                          {`{{${variable.name}}}`}
                        </p>
                      ) : (
                        <Input
                          className="mt-2"
                          inputSize="sm"
                          onChange={(event) =>
                            updateVariable(variable.name, {
                              default: event.target.value,
                            })
                          }
                          placeholder="Value"
                          type={inputTypeForRole(variable.role)}
                          value={variable.default}
                        />
                      )}

                      <ScopeToggle
                        onChange={(scope) =>
                          updateVariable(variable.name, { scope })
                        }
                        value={scope}
                      />
                    </div>
                  );
                })
              ) : (
                <p className="m-0 rounded-lg bg-madoo-bg p-3 text-xs leading-5 text-madoo-ink-muted shadow-madoo-border">
                  No variables.
                </p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg bg-white shadow-madoo-border">
            <EmailPreviewFrame
              className="h-[78vh] min-h-130"
              html={detail.compiledHtml}
              title={`${detail.name} preview`}
            />
          </section>
        </div>
      ) : (
        <div className="grid min-h-80 place-items-center text-sm text-madoo-ink-muted">
          Template unavailable
        </div>
      )}
    </Modal>
  );
}

export function ShareToCommunityModal({
  email,
  isPending,
  onClose,
  onSubmit,
}: {
  email: EmailDto | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: ShareEmailToCommunityInput) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    CommunityTemplateCategory[]
  >([]);
  const [suggestedCategories, setSuggestedCategories] = useState<
    CommunityTemplateCategory[]
  >([]);
  const [confirming, setConfirming] = useState(false);
  const [variantSeq, setVariantSeq] = useState<number | null>(null);

  const variantsDesc = useMemo(
    () => [...(email?.variants ?? [])].sort((a, b) => b.seq - a.seq),
    [email?.variants],
  );
  const latestSeq = variantsDesc[0]?.seq ?? null;
  const selectedSeq = variantSeq ?? latestSeq;

  useEffect(() => {
    if (!email) return;
    const suggestions = suggestCommunityCategories(email);
    setName(getEmailTitle(email));
    setDescription("");
    setSelectedCategories(suggestions);
    setSuggestedCategories(suggestions);
    setConfirming(false);
    setVariantSeq(null);
  }, [email?.id]);

  const submit = () => {
    if (!email || !name.trim() || selectedCategories.length === 0) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSubmit({
      emailId: email.id,
      variantSeq: selectedSeq ?? undefined,
      name: name.trim(),
      description: description.trim() || null,
      category: selectedCategories[0] ?? null,
      categories: selectedCategories,
    });
  };

  const categoryLimitReached =
    selectedCategories.length >= COMMUNITY_TEMPLATE_MAX_CATEGORIES;

  return (
    <Modal
      description={
        confirming
          ? "This will publish the template to the public community gallery."
          : "Add public gallery details before publishing."
      }
      footer={
        <>
          {confirming ? (
            <Button
              disabled={isPending}
              onClick={() => setConfirming(false)}
              size="sm"
              variant="ghost"
            >
              Back
            </Button>
          ) : (
            <Button onClick={onClose} size="sm" variant="ghost">
              Cancel
            </Button>
          )}
          <Button
            disabled={
              !email ||
              !name.trim() ||
              selectedCategories.length === 0 ||
              isPending
            }
            onClick={submit}
            size="sm"
            variant="primary"
          >
            {isPending
              ? "Publishing"
              : confirming
                ? "Publish publicly"
                : "Continue"}
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(email)}
      size="md"
      title={confirming ? "Confirm public publish" : "Share to community"}
    >
      {confirming ? (
        <div className="grid gap-3 text-sm leading-6 text-madoo-ink-muted">
          <p className="m-0">
            Publishing makes this email template visible to all community users.
            They can preview it, star it, and create their own email from it.
          </p>
          <p className="m-0">
            Do not publish private customer work, confidential campaign copy, or
            templates with assets you do not want others to reuse.
          </p>
          <div className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border">
            <div className="text-xs font-medium uppercase text-madoo-ink-muted">
              Template name
            </div>
            <div className="mt-1 text-sm font-medium text-madoo-ink">
              {name.trim()}
            </div>
          </div>
          <div className="rounded-lg bg-madoo-bg p-3 shadow-madoo-border">
            <div className="text-xs font-medium uppercase text-madoo-ink-muted">
              Categories
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedCategories.map((category) => (
                <span
                  className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-madoo-ink shadow-madoo-border"
                  key={category}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            label="Name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          {variantsDesc.length > 1 ? (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-madoo-ink">
                Version to publish
              </span>
              <Select
                onChange={(value) => setVariantSeq(Number(value))}
                options={variantsDesc.map((v) => ({
                  value: String(v.seq),
                  label:
                    v.seq === latestSeq
                      ? `Version ${v.seq} · latest`
                      : `Version ${v.seq}`,
                }))}
                value={String(selectedSeq ?? "")}
                variant="surface"
              />
            </div>
          ) : null}
          <Textarea
            label="Description"
            noResize
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            value={description}
          />
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-madoo-ink">
                Categories
              </span>
              <span className="text-[12px] text-madoo-ink-muted">
                Choose up to {COMMUNITY_TEMPLATE_MAX_CATEGORIES}
              </span>
            </div>
            {suggestedCategories.length ? (
              <div className="rounded-lg bg-madoo-accent-soft p-3">
                <p className="m-0 mb-2 text-[12px] font-medium text-madoo-accent-deep">
                  Suggested for this template
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedCategories.map((category) => (
                    <button
                      aria-pressed={selectedCategories.includes(category)}
                      className={cx(
                        "h-8 cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium transition",
                        selectedCategories.includes(category)
                          ? "bg-madoo-ink text-white"
                          : "bg-white text-madoo-accent-deep shadow-madoo-border",
                      )}
                      key={category}
                      onClick={() =>
                        setSelectedCategories((current) =>
                          toggleCategorySelection(current, category),
                        )
                      }
                      type="button"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {COMMUNITY_TEMPLATE_CATEGORIES.map((category) => {
                const selected = selectedCategories.includes(category);
                const disabled = !selected && categoryLimitReached;
                return (
                  <button
                    aria-pressed={selected}
                    className={cx(
                      "h-8 rounded-full border-0 px-3 text-[12px] font-medium transition",
                      selected
                        ? "cursor-pointer bg-madoo-ink text-white"
                        : disabled
                          ? "cursor-not-allowed bg-madoo-bg-2 text-madoo-ink-muted/55"
                          : "cursor-pointer bg-madoo-bg-2 text-madoo-ink-muted shadow-madoo-border hover:text-madoo-ink",
                    )}
                    disabled={disabled}
                    key={category}
                    onClick={() =>
                      setSelectedCategories((current) =>
                        toggleCategorySelection(current, category),
                      )
                    }
                    type="button"
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
