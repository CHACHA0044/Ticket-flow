/**
 * Inline SVG charts.
 *
 * Hand-rolled rather than pulled from a charting library: the admin screen needs
 * three simple shapes, and a dependency would add several hundred kilobytes to
 * every route that imports it. These render server-side, carry no animation, and
 * expose their data through `role="img"` + `aria-label` with an adjacent table
 * fallback for the primary chart.
 */

export interface Point {
  label: string
  value: number
}

/** Smooth-ish line/area chart with a baseline and no axes clutter. */
export function RevenueAreaChart({
  data,
  format,
  height = 180,
}: {
  data: Point[]
  format: (value: number) => string
  height?: number
}) {
  const width = 640
  const padding = { top: 12, right: 8, bottom: 24, left: 8 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const max = Math.max(...data.map((point) => point.value), 1)
  const step = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth

  const points = data.map((point, index) => ({
    ...point,
    x: padding.left + index * step,
    y: padding.top + innerHeight - (point.value / max) * innerHeight,
  }))

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const area = `${line} L${points.at(-1)?.x ?? 0},${padding.top + innerHeight} L${points[0]?.x ?? 0},${
    padding.top + innerHeight
  } Z`

  const last = points.at(-1)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Net revenue over ${data.length} days, peaking at ${format(max)}.`}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-400)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-gold-400)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={width - padding.right}
          y2={padding.top + innerHeight}
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1"
        />

        <path d={area} fill="url(#revenue-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-gold-300)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 3.5 : 2} fill="var(--color-gold-200)" />
            {(index === 0 || index === points.length - 1) && (
              <text
                x={point.x}
                y={height - 6}
                textAnchor={index === 0 ? 'start' : 'end'}
                className="fill-current text-[11px] opacity-55"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}

        {last && (
          <text
            x={last.x - 6}
            y={last.y - 10}
            textAnchor="end"
            className="fill-[var(--color-gold-200)] text-[11px] font-medium"
          >
            {format(last.value)}
          </text>
        )}
      </svg>

      {/* Data fallback for assistive technology. */}
      <figcaption className="sr-only">
        <table>
          <caption>Net revenue by day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Net revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td>{format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}

/** Horizontal occupancy bars, one per event. */
export function OccupancyBars({
  data,
}: {
  data: { label: string; sold: number; held: number; total: number; occupancy: number }[]
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {data.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-ink-soft">{row.label}</span>
            <span className="shrink-0 font-mono tabular-nums text-ink-mute">
              {row.occupancy.toFixed(0)}%
            </span>
          </div>

          <div
            className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/8"
            role="img"
            aria-label={`${row.label}: ${row.sold} sold of ${row.total}, ${row.held} held, ${row.occupancy.toFixed(0)} percent occupied.`}
          >
            <span className="h-full bg-gold-400/80" style={{ width: `${row.occupancy}%` }} />
            {/* Held inventory is a distinct state from sold — worth its own segment. */}
            <span className="h-full bg-signal-hold/70" style={{ width: `${pct(row.held, row.total)}%` }} />
          </div>

          <p className="mt-1 font-mono text-2xs text-ink-faint">
            {row.sold} sold
            {row.held > 0 && ` · ${row.held} held`}
            {` · ${row.total - row.sold - row.held} free`}
          </p>
        </li>
      ))}
    </ul>
  )
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0
}
