"use client";

import { useRef, useState } from "react";

const VIEW_W = 1000;

export const CHART_COLORS = [
  "#2563eb",
  "#0f9f6e",
  "#7c3aed",
  "#f59e0b",
  "#db2777",
  "#0891b2",
  "#dc2626",
  "#4f46e5",
];

function niceTop(max: number): number {
  if (max <= 1) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const scaled = max / pow;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * pow;
}

export type LineSeries = { name: string; color: string; points: number[] };

/** Responsive multi-series line chart with y-axis value labels, an optional
 *  area fill, and a hover tooltip. Hand-rolled SVG — no chart dependency. */
export function LineChart({
  labels,
  tooltipLabels,
  series,
  height = 200,
  suffix = "",
  area = false,
}: {
  labels: string[];
  tooltipLabels?: string[];
  series: LineSeries[];
  height?: number;
  suffix?: string;
  area?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const n = labels.length;
  const padY = 12;
  const top = niceTop(Math.max(1, ...series.flatMap((s) => s.points)));
  const innerH = height - padY * 2;

  const x = (index: number) => (n <= 1 ? 0 : (index / (n - 1)) * VIEW_W);
  const y = (value: number) => padY + innerH - (value / top) * innerH;

  const onMove = (event: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const frac = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  const ticks = [top, Math.round(top / 2), 0];
  // Show a sparse set of x labels so they never overlap.
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <div className="flex">
      <div
        className="flex flex-col justify-between pr-2 text-right text-xs leading-none text-madoo-faint"
        style={{ height, paddingTop: padY - 4, paddingBottom: padY - 4 }}
      >
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          ref={wrapRef}
          className="relative"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${height}`}
            preserveAspectRatio="none"
            className="block w-full"
            style={{ height }}
            role="img"
            aria-label="Line chart"
          >
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={0}
                x2={VIEW_W}
                y1={padY + innerH * f}
                y2={padY + innerH * f}
                stroke="rgb(17 24 39 / 0.07)"
                strokeWidth={1}
              />
            ))}
            {area
              ? series.map((s) => {
                  const d =
                    s.points
                      .map(
                        (v, i) =>
                          `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
                      )
                      .join(" ") +
                    ` L${x(n - 1).toFixed(1)} ${(padY + innerH).toFixed(1)} L0 ${(padY + innerH).toFixed(1)} Z`;
                  return (
                    <path key={`a-${s.name}`} d={d} fill={s.color} opacity={0.1} />
                  );
                })
              : null}
            {series.map((s) => {
              const d = s.points
                .map(
                  (v, i) =>
                    `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
                )
                .join(" ");
              return (
                <path
                  key={s.name}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {hover !== null ? (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padY}
                y2={padY + innerH}
                stroke="rgb(17 24 39 / 0.25)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          {/* Hover dots as HTML so they stay round (the SVG is x-stretched by
              preserveAspectRatio="none", which would squash SVG circles). */}
          {hover !== null
            ? series.map((s) => (
                <span
                  key={s.name}
                  className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
                  style={{
                    left: `${n <= 1 ? 50 : (hover / (n - 1)) * 100}%`,
                    top: `${y(s.points[hover] ?? 0)}px`,
                    borderColor: s.color,
                  }}
                />
              ))
            : null}

          {hover !== null ? (
            <div
              className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-madoo-ink px-2.5 py-1.5 text-sm text-white shadow-[0_0_0_0.5px_rgb(17_24_39/0.4)]"
              style={{ left: `${n <= 1 ? 50 : (hover / (n - 1)) * 100}%` }}
            >
              <div className="mb-0.5 font-semibold">
                {(tooltipLabels ?? labels)[hover]}
              </div>
              {series.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.name}
                  <span className="ml-auto pl-3 font-semibold">
                    {s.points[hover] ?? 0}
                    {suffix}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-madoo-faint">
          {labels.map((label, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <span key={i}>{label}</span>
            ) : (
              <span key={i} className="w-0 overflow-hidden" aria-hidden />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export type Bar = { label: string; value: number; hint?: string; color?: string };

/** Vertical bar chart with a value label on each bar and a hover tooltip. */
export function BarChart({
  bars,
  color = "#2563eb",
  height = 200,
  unitSingular = "user",
  unitPlural = "users",
}: {
  bars: Bar[];
  color?: string;
  height?: number;
  unitSingular?: string;
  unitPlural?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((bar, index) => {
        const h = Math.max(2, Math.round((bar.value / max) * (height - 48)));
        const fill = bar.color ?? color;
        return (
          <div
            key={bar.label}
            className="relative flex flex-1 flex-col items-center justify-end gap-1.5"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === index ? (
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-madoo-ink px-2.5 py-1.5 text-sm text-white shadow-[0_0_0_0.5px_rgb(17_24_39/0.4)]">
                <div className="font-semibold">
                  {bar.value} {bar.value === 1 ? unitSingular : unitPlural}
                </div>
                <div className="text-white/70">{bar.hint ?? bar.label}</div>
              </div>
            ) : null}
            <span className="text-sm font-semibold tabular-nums text-madoo-text">
              {bar.value}
            </span>
            <div
              className="w-full rounded-t-md transition-[filter] hover:brightness-95"
              style={{
                height: h,
                background: `linear-gradient(180deg, ${fill}, ${fill}bb)`,
              }}
            />
            <span className="text-center text-sm leading-tight text-madoo-muted">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

/** Donut chart with a center total, a hover tooltip, and a counted legend. */
export function DonutChart({
  segments,
  centerLabel = "Total",
}: {
  segments: DonutSegment[];
  centerLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 150;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, s) => acc + s.value, 0);
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="block"
          role="img"
          aria-label="Breakdown donut chart"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(17 24 39 / 0.06)"
            strokeWidth={stroke}
          />
          {sum > 0
            ? segments.map((s, i) => {
                const frac = s.value / sum;
                const dash = frac * circumference;
                const el = (
                  <circle
                    key={s.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={hover === i ? stroke + 3 : stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ cursor: "pointer", transition: "stroke-width .12s" }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
                offset += dash;
                return el;
              })
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-madoo-text">
            {hover !== null ? segments[hover].value : sum}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-madoo-faint">
            {hover !== null ? segments[hover].label : centerLabel}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {segments.map((s, i) => {
          const pct = sum > 0 ? Math.round((s.value / sum) * 100) : 0;
          return (
            <li
              key={s.label}
              className="flex items-center gap-2 text-sm text-madoo-muted"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ background: s.color }}
              />
              {s.label}
              <span className="ml-auto pl-4 font-semibold text-madoo-text">
                {s.value}
                <span className="ml-1 font-normal text-madoo-faint">
                  {pct}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weekday × hour heatmap. Cells show their count and a hover tooltip. */
export function Heatmap({
  cells,
}: {
  // weekday: 0=Sun..6=Sat (JS getDay), hour: 0..23
  cells: { weekday: number; hour: number; count: number }[];
}) {
  const [hover, setHover] = useState<{ w: number; h: number } | null>(null);
  const map = new Map<string, number>();
  for (const c of cells) map.set(`${c.weekday}-${c.hour}`, c.count);
  const max = Math.max(1, ...cells.map((c) => c.count));
  // Display rows Monday..Sunday (JS index order 1,2,3,4,5,6,0).
  const rowOrder = [1, 2, 3, 4, 5, 6, 0];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex">
          <div className="w-9 shrink-0" />
          <div className="grid flex-1 gap-[2px] [grid-template-columns:repeat(24,minmax(0,1fr))]">
            {hours.map((h) => (
              <div
                key={h}
                className="text-center text-[9px] text-madoo-faint"
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
        </div>
        {rowOrder.map((w, rowIdx) => (
          <div key={w} className="mt-[2px] flex items-center">
            <div className="w-9 shrink-0 pr-2 text-right text-xs text-madoo-muted">
              {WEEKDAYS[rowIdx]}
            </div>
            <div className="grid flex-1 gap-[2px] [grid-template-columns:repeat(24,minmax(0,1fr))]">
              {hours.map((h) => {
                const count = map.get(`${w}-${h}`) ?? 0;
                const intensity = count === 0 ? 0 : 0.15 + (count / max) * 0.85;
                return (
                  <div
                    key={h}
                    className="relative flex aspect-square items-center justify-center rounded-[3px] text-[8px] font-semibold"
                    style={{
                      background:
                        count === 0
                          ? "rgb(17 24 39 / 0.04)"
                          : `rgb(37 99 235 / ${intensity})`,
                      color: intensity > 0.55 ? "#fff" : "#334155",
                    }}
                    onMouseEnter={() => setHover({ w, h })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {count > 0 ? count : ""}
                    {hover && hover.w === w && hover.h === h ? (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-madoo-ink px-2.5 py-1.5 text-sm text-white shadow-[0_0_0_0.5px_rgb(17_24_39/0.4)]">
                        {WEEKDAYS[rowIdx]} {String(h).padStart(2, "0")}:00 —{" "}
                        {count} {count === 1 ? "email" : "emails"}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
