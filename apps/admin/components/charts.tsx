/**
 * Lightweight inline-SVG charts. Pure functions so they render server-side with
 * no client JS or chart dependency. Styling follows the Madoo palette from
 * design.md (paper surfaces, no elevation shadows).
 */

const AXIS = "rgb(17 24 39 / 0.08)";

export type SeriesPoint = { label: string; value: number };

export function AreaChart({
  data,
  color = "#2563eb",
  height = 132,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
}) {
  const width = 640;
  const padX = 6;
  const padY = 12;
  const max = Math.max(1, ...data.map((point) => point.value));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const coords = data.map((point, index) => {
    const x = padX + index * stepX;
    const y = padY + innerH - (point.value / max) * innerH;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area =
    coords.length > 0
      ? `${line} L${(padX + innerW).toFixed(1)} ${(padY + innerH).toFixed(1)} L${padX.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`
      : "";
  const gradientId = `area-grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      className="area-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Trend chart"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1={padX}
          x2={width - padX}
          y1={padY + innerH * fraction}
          y2={padY + innerH * fraction}
          stroke={AXIS}
          strokeWidth="1"
        />
      ))}
      {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      {line ? (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {coords.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({
  segments,
  total,
}: {
  segments: DonutSegment[];
  total: number;
}) {
  const size = 132;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  let offset = 0;

  return (
    <svg
      className="donut-chart"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Breakdown chart"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={AXIS}
        strokeWidth={stroke}
      />
      {sum > 0
        ? segments.map((segment) => {
            const fraction = segment.value / sum;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return el;
          })
        : null}
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="#171a21"
      >
        {total}
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#6b7382"
        style={{ textTransform: "uppercase" }}
      >
        Total
      </text>
    </svg>
  );
}

export function ChartLegend({ segments }: { segments: DonutSegment[] }) {
  return (
    <ul className="chart-legend">
      {segments.map((segment) => (
        <li key={segment.label}>
          <span className="dot" style={{ background: segment.color }} />
          {segment.label}
          <strong>{segment.value}</strong>
        </li>
      ))}
    </ul>
  );
}
