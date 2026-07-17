"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  TextAlignCenterIcon,
  TextAlignLeft01Icon,
  TextAlignRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button, Input, Select } from "@madoo/design-system";
import type { VisualEditStylePatch, VisualEditStyleProperty } from "@madoo/shared";
import { cn } from "@/lib/utils";

const COMMIT_DEBOUNCE_MS = 450;

/** Email-safe font stacks designers can switch to. */
const FONT_STACKS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  {
    label: "System UI",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
] as const;

const FONT_WEIGHTS = [
  { label: "Light (300)", value: "300" },
  { label: "Regular (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extrabold (800)", value: "800" },
];

const BORDER_STYLES = [
  { label: "None", value: "none" },
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
];

/** `rgb(a)` → `#rrggbb`; fully transparent and unparsable values become "". */
function toHex(value: string | undefined): string {
  if (!value) return "";
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const m = value.match(
    /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/,
  );
  if (!m) return "";
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return "";
  const hex = (part: string) =>
    Math.min(255, Number(part)).toString(16).padStart(2, "0");
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

/** Computed px value → rounded number-as-string for an input ("" if not px). */
function pxNumber(value: string | undefined): string {
  const n = parseFloat(value ?? "");
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "";
}

function normalizeWeight(value: string | undefined): string {
  if (value === "normal") return "400";
  if (value === "bold") return "700";
  return value && /^\d+$/.test(value) ? value : "400";
}

type Draft = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  color: string;
  backgroundColor: string;
  borderRadius: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  width: string;
};

function draftFrom(computed: CSSStyleDeclaration | null): Draft {
  return {
    fontFamily: computed?.fontFamily ?? "",
    fontSize: pxNumber(computed?.fontSize),
    fontWeight: normalizeWeight(computed?.fontWeight),
    lineHeight: pxNumber(computed?.lineHeight),
    letterSpacing:
      computed?.letterSpacing === "normal"
        ? "0"
        : pxNumber(computed?.letterSpacing),
    textAlign: computed?.textAlign ?? "left",
    color: toHex(computed?.color),
    backgroundColor: toHex(computed?.backgroundColor),
    borderRadius: pxNumber(computed?.borderRadius),
    borderWidth: pxNumber(computed?.borderTopWidth),
    borderStyle: computed?.borderTopStyle || "none",
    borderColor: toHex(computed?.borderTopColor),
    paddingTop: pxNumber(computed?.paddingTop),
    paddingRight: pxNumber(computed?.paddingRight),
    paddingBottom: pxNumber(computed?.paddingBottom),
    paddingLeft: pxNumber(computed?.paddingLeft),
    marginTop: pxNumber(computed?.marginTop),
    marginRight: pxNumber(computed?.marginRight),
    marginBottom: pxNumber(computed?.marginBottom),
    marginLeft: pxNumber(computed?.marginLeft),
    width: pxNumber(computed?.width),
  };
}

/**
 * Manual property editor for the element selected in the preview. Every
 * change applies instantly to the iframe DOM (live preview) and is committed
 * to the TSX as a debounced `setStyle` op — the same autosave pipeline the
 * text/drag edits use, so the component code stays the single source of
 * truth and edits survive refresh/export.
 *
 * The parent keys this component by nodeId, so the draft re-initializes from
 * the element's computed style whenever the selection changes.
 */
export function StylePanel({
  className,
  isImage,
  label,
  nodeId,
  onClose,
  onCommit,
  onPreview,
  readStyles,
}: {
  className?: string;
  isImage: boolean;
  label: string;
  nodeId: string;
  onClose: () => void;
  onCommit: (nodeId: string, styles: VisualEditStylePatch) => void;
  onPreview: (nodeId: string, styles: Record<string, string | null>) => void;
  readStyles: (nodeId: string) => CSSStyleDeclaration | null;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(readStyles(nodeId)));

  const pendingRef = useRef<Partial<
    Record<VisualEditStyleProperty, string | null>
  > | null>(null);
  const timerRef = useRef<number | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const flush = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending && Object.keys(pending).length > 0) {
      onCommitRef.current(nodeId, pending as VisualEditStylePatch);
    }
  }, [nodeId]);

  // Commit whatever is pending when the panel closes or the element changes.
  useEffect(() => flush, [flush]);

  const setProp = useCallback(
    (
      prop: VisualEditStyleProperty,
      draftPatch: Partial<Draft>,
      cssValue: string | null,
    ) => {
      setDraft((current) => ({ ...current, ...draftPatch }));
      onPreview(nodeId, { [prop]: cssValue });
      pendingRef.current = { ...pendingRef.current, [prop]: cssValue };
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flush, COMMIT_DEBOUNCE_MS);
    },
    [flush, nodeId, onPreview],
  );

  const setPx = (
    prop: VisualEditStyleProperty,
    key: keyof Draft,
    raw: string,
  ) => {
    const n = parseFloat(raw);
    setProp(prop, { [key]: raw }, Number.isFinite(n) ? `${n}px` : null);
  };

  const fontValue =
    FONT_STACKS.find(
      (stack) =>
        stack.value.replace(/['"\s]/g, "").toLowerCase() ===
        draft.fontFamily.replace(/['"\s]/g, "").toLowerCase(),
    )?.value ?? draft.fontFamily;
  const fontOptions = [
    ...(FONT_STACKS.some((stack) => stack.value === fontValue)
      ? []
      : [
          {
            label: `Current (${draft.fontFamily.split(",")[0]?.replace(/['"]/g, "").trim() || "inherited"})`,
            value: draft.fontFamily,
          },
        ]),
    ...FONT_STACKS,
  ];

  return (
    <aside
      aria-label="Element style editor"
      className={cn(
        "flex h-full w-72 shrink-0 flex-col bg-madoo-bg shadow-[inset_1px_0_0_rgb(var(--rule-rgb)/0.12)]",
        className,
      )}
    >
      <div className="madoo-preview-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-madoo-ink">Design</h3>
            <p
              className="mt-1 truncate text-xs leading-5 text-madoo-ink-muted"
              title={label}
            >
              {label}
            </p>
          </div>
          <Button
            aria-label="Close style panel"
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

        {!isImage ? (
          <Section title="Text">
            <Field label="Font">
              <Select
                onChange={(value) =>
                  setProp("fontFamily", { fontFamily: value }, value)
                }
                options={fontOptions}
                size="sm"
                value={fontValue}
                variant="surface"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size">
                <NumberField
                  min={8}
                  onChange={(raw) => setPx("fontSize", "fontSize", raw)}
                  value={draft.fontSize}
                />
              </Field>
              <Field label="Weight">
                <Select
                  onChange={(value) =>
                    setProp("fontWeight", { fontWeight: value }, value)
                  }
                  options={FONT_WEIGHTS}
                  size="sm"
                  value={
                    FONT_WEIGHTS.some((w) => w.value === draft.fontWeight)
                      ? draft.fontWeight
                      : "400"
                  }
                  variant="surface"
                />
              </Field>
              <Field label="Line height">
                <NumberField
                  min={0}
                  onChange={(raw) => setPx("lineHeight", "lineHeight", raw)}
                  value={draft.lineHeight}
                />
              </Field>
              <Field label="Letter spacing">
                <NumberField
                  onChange={(raw) =>
                    setPx("letterSpacing", "letterSpacing", raw)
                  }
                  step={0.1}
                  value={draft.letterSpacing}
                />
              </Field>
            </div>
            <Field label="Align">
              <AlignToggle
                onChange={(value) =>
                  setProp("textAlign", { textAlign: value }, value)
                }
                value={draft.textAlign}
              />
            </Field>
            <ColorField
              label="Text color"
              onChange={(hex) => setProp("color", { color: hex ?? "" }, hex)}
              value={draft.color}
            />
          </Section>
        ) : null}

        <Section title="Fill & border">
          <ColorField
            label="Background"
            onChange={(hex) =>
              setProp("backgroundColor", { backgroundColor: hex ?? "" }, hex)
            }
            value={draft.backgroundColor}
          />
          <Field label="Corner radius">
            <NumberField
              min={0}
              onChange={(raw) => setPx("borderRadius", "borderRadius", raw)}
              value={draft.borderRadius}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Border width">
              <NumberField
                min={0}
                onChange={(raw) => setPx("borderWidth", "borderWidth", raw)}
                value={draft.borderWidth}
              />
            </Field>
            <Field label="Border style">
              <Select
                onChange={(value) =>
                  setProp("borderStyle", { borderStyle: value }, value)
                }
                options={BORDER_STYLES}
                size="sm"
                value={
                  BORDER_STYLES.some((s) => s.value === draft.borderStyle)
                    ? draft.borderStyle
                    : "none"
                }
                variant="surface"
              />
            </Field>
          </div>
          <ColorField
            label="Border color"
            onChange={(hex) =>
              setProp("borderColor", { borderColor: hex ?? "" }, hex)
            }
            value={draft.borderColor}
          />
        </Section>

        <Section title="Spacing">
          <SidesGrid
            legend="Padding"
            onChange={(side, raw) =>
              setPx(
                `padding${side}` as VisualEditStyleProperty,
                `padding${side}` as keyof Draft,
                raw,
              )
            }
            values={{
              Top: draft.paddingTop,
              Right: draft.paddingRight,
              Bottom: draft.paddingBottom,
              Left: draft.paddingLeft,
            }}
          />
          <SidesGrid
            legend="Margin"
            onChange={(side, raw) =>
              setPx(
                `margin${side}` as VisualEditStyleProperty,
                `margin${side}` as keyof Draft,
                raw,
              )
            }
            values={{
              Top: draft.marginTop,
              Right: draft.marginRight,
              Bottom: draft.marginBottom,
              Left: draft.marginLeft,
            }}
          />
        </Section>

        {isImage ? (
          <Section title="Size">
            <Field label="Width">
              <NumberField
                min={8}
                onChange={(raw) => setPx("width", "width", raw)}
                value={draft.width}
              />
            </Field>
          </Section>
        ) : null}
      </div>
    </aside>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-4 rounded-lg bg-madoo-surface p-3 shadow-madoo-border">
      <h4 className="text-[11px] font-semibold tracking-[0.3px] text-madoo-ink-muted uppercase">
        {title}
      </h4>
      <div className="mt-2.5 space-y-2.5">{children}</div>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-medium text-madoo-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberField({
  min,
  onChange,
  step = 1,
  value,
}: {
  min?: number;
  onChange: (raw: string) => void;
  step?: number;
  value: string;
}) {
  return (
    <div className="relative">
      <Input
        inputSize="sm"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-madoo-ink-faint">
        px
      </span>
    </div>
  );
}

function ColorField({
  label,
  onChange,
  value,
}: {
  label: string;
  /** `null` removes the explicit property. */
  onChange: (hex: string | null) => void;
  value: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[11px] font-medium text-madoo-ink-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="relative size-7.5 shrink-0 overflow-hidden rounded-md shadow-madoo-border">
          {value ? null : (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,#fff_25%,#fff_75%,#e5e7eb_75%)] bg-[position:0_0,4px_4px] bg-[size:8px_8px]"
            />
          )}
          <input
            aria-label={`${label} picker`}
            className="absolute -inset-1 size-[150%] cursor-pointer border-0 p-0"
            onChange={(event) => onChange(event.target.value)}
            type="color"
            value={value || "#ffffff"}
          />
        </span>
        <Input
          className="flex-1"
          inputSize="sm"
          onBlur={() => {
            const raw = text.trim();
            if (raw === "") {
              onChange(null);
              return;
            }
            const hex = raw.startsWith("#") ? raw : `#${raw}`;
            if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toLowerCase());
            else setText(value);
          }}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder="none"
          spellCheck={false}
          value={text}
        />
        {value ? (
          <Button
            aria-label={`Clear ${label.toLowerCase()}`}
            className="size-7 shrink-0 rounded-md p-0!"
            onClick={() => onChange(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={Cancel01Icon}
              primaryColor="currentColor"
              size={13}
              strokeWidth={1.7}
            />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AlignToggle({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const options = [
    { icon: TextAlignLeft01Icon, value: "left" },
    { icon: TextAlignCenterIcon, value: "center" },
    { icon: TextAlignRight01Icon, value: "right" },
  ];
  return (
    <div className="flex gap-1 rounded-lg bg-madoo-bg-2 p-1">
      {options.map((option) => (
        <button
          aria-label={`Align ${option.value}`}
          aria-pressed={value === option.value}
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center rounded-md py-1 transition-colors",
            value === option.value
              ? "bg-white text-madoo-ink shadow-madoo-border"
              : "text-madoo-ink-muted hover:text-madoo-ink",
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={option.icon}
            primaryColor="currentColor"
            size={15}
            strokeWidth={1.7}
          />
        </button>
      ))}
    </div>
  );
}

type Side = "Top" | "Right" | "Bottom" | "Left";

function SidesGrid({
  legend,
  onChange,
  values,
}: {
  legend: string;
  onChange: (side: Side, raw: string) => void;
  values: Record<Side, string>;
}) {
  const sides: Side[] = ["Top", "Right", "Bottom", "Left"];
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-madoo-ink-muted">
        {legend}
      </span>
      <div className="grid grid-cols-4 gap-1.5">
        {sides.map((side) => (
          <div key={side}>
            <Input
              aria-label={`${legend} ${side.toLowerCase()}`}
              inputSize="sm"
              onChange={(event) => onChange(side, event.target.value)}
              type="number"
              value={values[side]}
            />
            <span className="mt-0.5 block text-center text-[10px] text-madoo-ink-faint">
              {side[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
