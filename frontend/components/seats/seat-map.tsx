'use client'

import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { seatDescription, type SeatMapLayout } from '@/lib/seats/layout'
import { formatCurrency } from '@/lib/format'
import type { Seat, SeatRow, SeatStatus } from '@/types/seat'
import { cn } from '@/lib/utils'

/**
 * Seat grid.
 *
 * Accessibility is the hard part of a seat map, and it is handled here rather
 * than left to the 400 individual buttons:
 *
 *   • **Roving tabindex** — the map is one tab stop, not 400. Arrow keys move
 *     between seats, Home/End jump within a row, PageUp/PageDown cross sections.
 *     A keyboard user reaches the map with one Tab and then navigates like a
 *     grid, which is what a seat plan is.
 *   • **Disabled ≠ unfocusable** — sold and held seats stay focusable and
 *     announce as "dimmed/unavailable", because a sighted user can see them and
 *     a keyboard user deserves the same information. They use `aria-disabled`
 *     and swallow activation rather than the `disabled` attribute.
 *   • **Every seat names itself** — `aria-label` carries section, row, number,
 *     price and current state, so no information is conveyed by colour alone.
 */

export type SeatZoom = 'compact' | 'default' | 'large'

const SEAT_SIZE: Record<SeatZoom, string> = {
  compact: '1.05rem',
  default: '1.35rem',
  large: '1.7rem',
}

export interface SeatMapProps {
  layout: SeatMapLayout
  isSelected: (seatId: string) => boolean
  onToggle: (seat: Seat) => void
  recentlyUpdated?: Set<string>
  zoom: SeatZoom
  className?: string
}

export function SeatMap({
  layout,
  isSelected,
  onToggle,
  recentlyUpdated,
  zoom,
  className,
}: SeatMapProps) {
  const seatRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const [focusedSeatId, setFocusedSeatId] = React.useState<string | null>(null)

  /** Flat row list in render order — the spine for vertical navigation. */
  const rows = React.useMemo(
    () => layout.sections.flatMap((section) => section.rows),
    [layout.sections],
  )

  const rowIndexBySeat = React.useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((row, rowIndex) => {
      for (const seat of row.seats) map.set(seat.id, rowIndex)
    })
    return map
  }, [rows])

  // The first selectable seat becomes the map's single tab stop.
  const initialTabStop = React.useMemo(() => {
    for (const section of layout.sections) {
      for (const row of section.rows) {
        const seat = row.seats.find((candidate) => candidate.status === 'AVAILABLE')
        if (seat) return seat.id
      }
    }
    return layout.sections[0]?.rows[0]?.seats[0]?.id ?? null
  }, [layout.sections])

  const activeSeatId = focusedSeatId ?? initialTabStop

  const focusSeat = React.useCallback((seatId: string) => {
    const node = seatRefs.current.get(seatId)
    node?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, seat: Seat) => {
    const rowIndex = rowIndexBySeat.get(seat.id)
    if (rowIndex === undefined) return

    const row = rows[rowIndex]
    if (!row) return

    const seatIndex = row.seats.findIndex((candidate) => candidate.id === seat.id)
    if (seatIndex === -1) return

    let target: Seat | undefined

    switch (event.key) {
      case 'ArrowRight':
        target = row.seats[seatIndex + 1]
        break
      case 'ArrowLeft':
        target = row.seats[seatIndex - 1]
        break
      case 'Home':
        target = row.seats[0]
        break
      case 'End':
        target = row.seats[row.seats.length - 1]
        break
      case 'ArrowDown':
        target = seatInRow(rows[rowIndex + 1], seatIndex)
        break
      case 'ArrowUp':
        target = seatInRow(rows[rowIndex - 1], seatIndex)
        break
      case 'PageDown':
        target = seatInRow(rows[rowIndex + 1], seatIndex)
        break
      case 'PageUp':
        target = seatInRow(rows[rowIndex - 1], seatIndex)
        break
      default:
        return
    }

    if (!target) return
    event.preventDefault()
    focusSeat(target.id)
  }

  return (
    <div className={cn('flex flex-col gap-8', className)} style={{ ['--seat-size' as string]: SEAT_SIZE[zoom] }}>
      {/*
       * Seat grids are fixed-width by design (the column count is derived from
       * the venue, not the viewport), so on phones they must scroll inside their
       * own container rather than stretch the page. `tabIndex` + `role="region"`
       * keep the scroll area reachable and announced for keyboard and screen
       * reader users, per the WCAG technique for scrollable regions.
       */}
      <div
        role="region"
        aria-label="Seat map"
        tabIndex={0}
        className="-mx-1 overflow-x-auto px-1 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/70"
      >
      {layout.sections.map((section) => (
        <section key={section.code} aria-labelledby={`section-${section.code}`}>
          <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
            <h3
              id={`section-${section.code}`}
              className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-mute"
            >
              <span className="text-gold-300">{section.code}</span>
              <span className="text-ink-faint"> · {section.name}</span>
            </h3>
            <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
              {section.available}/{section.total} open · {formatCurrency(section.price)}
            </p>
          </header>

          <div className="rounded-lg border border-white/8 bg-carbon/50 p-3 sm:p-4">
            <StageBar />

            <div className="mt-4 flex flex-col gap-1.5">
              {section.rows.map((row) => {
                if (row.seats.length === 0) return null

                return (
                  <div
                    key={`${section.code}-${row.rowLabel}`}
                    className="grid items-center gap-1"
                    style={{
                      gridTemplateColumns: `1.5rem repeat(${layout.columns}, var(--seat-size))`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="text-center font-mono text-2xs text-ink-faint tabular-nums"
                    >
                      {row.rowLabel}
                    </span>

                    {Array.from({ length: row.indent }, (_, index) => (
                      <span key={`indent-${index}`} aria-hidden />
                    ))}

                    {row.seats.map((seat, seatIndex) => {
                      const selectable = seat.status === 'AVAILABLE'
                      const selected = isSelected(seat.id)

                      return (
                        <React.Fragment key={seat.id}>
                          {seatIndex === row.leftCount && row.centerGap > 0 &&
                            Array.from({ length: row.centerGap }, (_, index) => (
                              <span key={`gap-${index}`} aria-hidden />
                            ))}
                          <SeatButton
                            ref={(node) => {
                              if (node) seatRefs.current.set(seat.id, node)
                              else seatRefs.current.delete(seat.id)
                            }}
                            seat={seat}
                            selectable={selectable}
                            selected={selected}
                            tabStop={seat.id === activeSeatId}
                            justChanged={recentlyUpdated?.has(seat.id) ?? false}
                            onToggle={onToggle}
                            onKeyDown={(event) => handleKeyDown(event, seat)}
                            onFocus={() => setFocusedSeatId(seat.id)}
                          />
                        </React.Fragment>
                      )
                    })}

                    {/* Trailing cells hold the row's grid width constant across blocks */}
                    {Array.from(
                      {
                        length: Math.max(
                          0,
                          layout.columns - row.indent - row.seats.length - row.centerGap,
                        ),
                      },
                      (_, index) => <span key={`tail-${index}`} aria-hidden />,
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ))}
      </div>
    </div>
  )
}

/**
 * Vertical navigation target: the seat in `targetRow` occupying the same column
 * as the seat the user is leaving, clamped to that row's width. Rows in a venue
 * block are not always the same length, so clamping is required rather than
 * optional — `Math.min` against a possibly-absent row would yield `NaN`.
 */
function seatInRow(targetRow: SeatRow | undefined, seatIndex: number): Seat | undefined {
  if (!targetRow || targetRow.seats.length === 0) return undefined
  return targetRow.seats[Math.min(seatIndex, targetRow.seats.length - 1)]
}

function StageBar() {  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <span className="font-mono text-2xs uppercase tracking-[0.3em] text-gold-300/80">Stage</span>
      <div className="h-1 w-3/4 rounded-full bg-linear-to-r from-transparent via-gold-400/50 to-transparent" />
    </div>
  )
}

const SeatButton = React.forwardRef<
  HTMLButtonElement,
  {
    seat: Seat
    selectable: boolean
    selected: boolean
    tabStop: boolean
    justChanged: boolean
    onToggle: (seat: Seat) => void
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
    onFocus: () => void
  }
>(function SeatButton(
  { seat, selectable, selected, tabStop, justChanged, onToggle, onKeyDown, onFocus },
  ref,
) {
  const label = `${seatDescription(seat)}, ${formatCurrency(seat.price)}, ${stateLabel(
    seat,
    selectable,
    selected,
  )}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          // Roving tabindex: only the active seat is in the tab order.
          tabIndex={tabStop ? 0 : -1}
          aria-pressed={selected}
          aria-disabled={!selectable}
          aria-label={label}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onClick={() => {
            if (!selectable) return
            onToggle(seat)
          }}
          data-status={seat.status}
          data-seat-id={seat.id}
          className={cn(
            'relative size-[var(--seat-size)] rounded-[3px] transition-[background-color,box-shadow,transform] duration-150',
            'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon',
            seatTone(seat.status, selected),
            selected && 'scale-110 shadow-[0_0_0_1px_rgba(244,230,176,0.9),0_0_18px_-4px_rgba(200,169,81,0.8)]',
            seat.lockedByCurrentUser && 'after:absolute after:inset-0 after:rounded-[3px] after:ring-1 after:ring-inset after:ring-gold-200/70',
            seat.accessible && 'before:absolute before:inset-x-0 before:bottom-0.5 before:mx-auto before:h-0.5 before:w-1/2 before:rounded-full before:bg-white/45',
            justChanged && 'animate-seat-flash',
          )}
        >
          {seat.lockedByCurrentUser && <span className="sr-only">Held by you</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="block font-medium text-ink">{seatDescription(seat)}</span>
        <span className="block text-ink-mute">{formatCurrency(seat.price)}</span>
        <span
          className={cn(
            'mt-1 block font-mono text-2xs uppercase tracking-[0.12em]',
            selected ? 'text-gold-200' : selectable ? 'text-signal-live' : 'text-ink-faint',
          )}
        >
          {stateLabel(seat, selectable, selected)}
        </span>
      </TooltipContent>
    </Tooltip>
  )
})

function stateLabel(seat: Seat, selectable: boolean, selected: boolean): string {
  if (selected) return 'Selected by you'
  if (seat.lockedByCurrentUser) return 'Held by you'
  if (seat.status === 'BOOKED') return 'Sold'
  if (seat.status === 'LOCKED') return 'Held by another buyer'
  if (seat.status === 'BLOCKED') return 'Unavailable'
  if (seat.accessible) return 'Available · accessible seat'
  return selectable ? 'Available' : 'Unavailable'
}

/**
 * Status → visual tone.
 *
 * Status is carried by an icon-free shape language (fill, ring, opacity) plus
 * the tooltip text and the button's accessible name, never by hue alone — the
 * three states are distinguishable in greyscale.
 */
function seatTone(status: SeatStatus, selected: boolean): string {
  if (selected) return 'bg-gold-400'
  switch (status) {
    case 'AVAILABLE':
      return 'bg-white/12 ring-1 ring-inset ring-white/25 hover:bg-gold-400/45 hover:ring-gold-200/70'
    case 'LOCKED':
      return 'cursor-not-allowed bg-signal-hold/22 ring-1 ring-inset ring-signal-hold/40'
    case 'BOOKED':
      return 'cursor-not-allowed bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]'
    case 'BLOCKED':
    default:
      return 'cursor-not-allowed bg-carbon-3 ring-1 ring-inset ring-white/[0.05]'
  }
}
