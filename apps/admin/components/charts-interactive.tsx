"use client";

import { useRef, useState } from "react";

const VIEW_W = 1000;

export type LineSeries = { name: string; color: string; points: number[] };

/**
 * Responsive multi-series line chart with a hover tooltip. Hand-rolled SVG (no
 * chart dependency) so it matches the Madoo palette and stays light.
 */
export function LineChart({
  labels,
  series,
  height = 200,
  suffix = "",
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  suffix?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const n = labels.length;
  const padY = 14;
  const max = Math.max(1, ...series.flatMap((s) => s.points));
  const innerH = height - padY * 2;

  const x = (index: number) => (n <= 1 ? 0 : (index / (n - 1)) * VIEW_W);
  const y = (value: number) => padY + innerH - (value / max) * innerH;

  const onMove = (event: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const frac = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        className="block h-auto w-full"
        style={{ height }}
        role="img"
        aria-label="Daily activity line chart"
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
        {series.map((s) => {
          const d = s.points
            .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
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
        {hover !== null
          ? series.map((s) => (
              <circle
                key={s.name}
                cx={x(hover)}
                cy={y(s.points[hover] ?? 0)}
                r={3.5}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))
          : null}
      </svg>

      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-madoo-ink px-2.5 py-1.5 text-xs text-white shadow-[0_0_0_0.5px_rgb(17_24_39/0.4)]"
          style={{
            left: `${n <= 1 ? 50 : (hover / (n - 1)) * 100}%`,
          }}
        >
          <div className="mb-0.5 font-semibold">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.name}
              <span className="ml-auto pl-2 font-semibold">
                {s.points[hover] ?? 0}
                {suffix}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type Bar = { label: string; value: number; hint?: string };

/** Vertical bar chart with per-bar hover tooltip. */
export function BarChart({
  bars,
  color = "#2563eb",
  height = 200,
}: {
  bars: Bar[];
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((bar, index) => {
        const h = Math.max(2, Math.round((bar.value / max) * (height - 34)));
        return (
          <div
            key={bar.label}
            className="relative flex flex-1 flex-col items-center justify-end gap-2"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === index ? (
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-y-0 whitespace-nowrap rounded-lg bg-madoo-ink px-2.5 py-1.5 text-xs text-white shadow-[0_0_0_0.5px_rgb(17_24_39/0.4)]">
                <div className="font-semibold">
                  {bar.value} {bar.value === 1 ? "user" : "users"}
                </div>
                <div className="text-white/70">{bar.hint ?? bar.label}</div>
              </div>
            ) : null}
            <div
              className="w-full rounded-t-md transition-[filter] hover:brightness-95"
              style={{
                height: h,
                background: `linear-gradient(180deg, ${color}, ${color}bb)`,
              }}
            />
            <span className="text-center text-[11px] leading-tight text-madoo-muted">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
