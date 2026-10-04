import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Venue } from '@/types/event'
import { SEAT_STATUS_LABEL } from '@/types/seat'

export interface VenueSchematicProps {
  venue: Venue
  /** Seats remaining per section code, used to tint each block. */
  availabilityBySection: Record<string, number>
  /** Highlights the section the user has selected seats in. */
  highlightedSections?: string[]
  className?: string
}

/**
 * Top-down seating schematic.
 *
 * A deliberately abstract bowl: stage at the front, then one block per section
 * with a fill proportional to what is still available. It orients a guest
 * ("we're in the left-hand block, past the aisle") without pretending to be a
 * navigational map, and it stays a single inline SVG so it scales to any
 * viewport and prints cleanly.
 */
export function VenueSchematic({
  venue,
  availabilityBySection,
  highlightedSections = [],
  className,
}: VenueSchematicProps) {
  const uid = React.useId().replace(/[:]/g, '')
  const sections = venue.sections
  const columns = sections.length > 4 ? 3 : 2
  const rows = Math.ceil(sections.length / columns)

  const blockWidth = 150
  const blockHeight = 78
  const gapX = 26
  const gapY = 34
  const padding = 26
  const stageHeight = 52

  const width = padding * 2 + columns * blockWidth + (columns - 1) * gapX
  const height =
    padding * 2 + stageHeight + gapY + rows * blockHeight + Math.max(0, rows - 1) * gapY

  const capacity = Math.max(
    1,
    venue.sections.reduce((sum, section) => sum + section.rows.length * section.seatsPerRow, 0),
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Seating plan for ${venue.name}`}
      className={cn('h-auto w-full', className)}
    >
      <defs>
        <linearGradient id={`${uid}-stage`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a951" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c8a951" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Stage */}
      <g>
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={stageHeight}
          rx={4}
          fill={`url(#${uid}-stage)`}
          stroke="rgba(200,169,81,0.45)"
        />
        <text
          x={width / 2}
          y={padding + stageHeight / 2 + 4}
          textAnchor="middle"
          className="fill-gold-200 font-mono"
          style={{ fontSize: 13, letterSpacing: '0.28em' }}
        >
          STAGE
        </text>
      </g>

      {sections.map((section, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const x = padding + column * (blockWidth + gapX)
        const y = padding + stageHeight + gapY + row * (blockHeight + gapY)

        const seatsInSection = section.rows.length * section.seatsPerRow
        const remaining = availabilityBySection[section.code] ?? seatsInSection
        const ratio = Math.min(1, remaining / capacity)
        const highlighted = highlightedSections.includes(section.code)
        const sold = remaining === 0

        return (
          <g key={section.code}>
            <rect
              x={x}
              y={y}
              width={blockWidth}
              height={blockHeight}
              rx={4}
              className={cn(
                'transition-[stroke,fill] duration-300',
                highlighted ? 'stroke-gold-300' : sold ? 'stroke-white/8' : 'stroke-white/14',
              )}
              fill={`rgba(255,255,255,${0.02 + ratio * 0.07})`}
              strokeWidth={highlighted ? 2 : 1}
            />

            {/* Availability fill, bottom-anchored */}
            <rect
              x={x}
              y={y + blockHeight * (1 - ratio)}
              width={blockWidth}
              height={blockHeight * ratio}
              rx={4}
              className={sold ? 'fill-white/4' : 'fill-gold-400/12'}
            />

            <text
              x={x + blockWidth / 2}
              y={y + 28}
              textAnchor="middle"
              className="fill-ink font-semibold"
              style={{ fontSize: 15, letterSpacing: '0.1em' }}
            >
              {section.code}
            </text>
            <text
              x={x + blockWidth / 2}
              y={y + 48}
              textAnchor="middle"
              className="fill-ink-mute font-mono"
              style={{ fontSize: 10, letterSpacing: '0.12em' }}
            >
              {section.tierName.toUpperCase()}
            </text>
            <text
              x={x + blockWidth / 2}
              y={y + 66}
              textAnchor="middle"
              className={sold ? 'fill-ink-faint font-mono' : 'fill-gold-200 font-mono'}
              style={{ fontSize: 10, letterSpacing: '0.1em' }}
            >
              {sold ? 'SOLD OUT' : `${remaining} LEFT`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Screen-reader legend that accompanies the schematic. */
export function VenueSchematicLegend() {
  const items: { label: string; className: string }[] = [
    { label: 'Well available', className: 'bg-gold-400/25 ring-gold-400/50' },
    { label: 'Limited', className: 'bg-gold-400/10 ring-gold-400/30' },
    { label: 'Sold out', className: 'bg-white/4 ring-white/10' },
    { label: SEAT_STATUS_LABEL.LOCKED, className: 'bg-signal-hold/25 ring-signal-hold/50' },
  ]

  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-ink-mute">
          <span className={cn('size-2.5 rounded-xs ring-1', item.className)} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  )
}