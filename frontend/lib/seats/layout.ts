import type { Seat, SeatCategoryInfo, SeatRow, SeatSection } from '@/types/seat'
import type { Venue } from '@/types/event'

/**
 * Venue layout geometry.
 *
 * Pure presentation logic: turns a flat seat list plus a venue definition into
 * the render model used by <SeatMap />. Kept out of the transport layer so the
 * REST contract can stay a compact flat array, and so the same builder works
 * identically against mock and live data.
 */

export interface SeatMapLayout {
  sections: SeatSection[]
  categories: SeatCategoryInfo[]
  /** Widest rendered row, i.e. the number of grid columns the map needs. */
  columns: number
  totals: {
    total: number
    available: number
    locked: number
    booked: number
    blocked: number
  }
}

/** Sections at least this wide get a centre aisle. */
const CENTRE_AISLE_MIN_WIDTH = 16
const CENTRE_AISLE_COLUMNS = 2

export function buildSeatMapLayout(venue: Venue, seats: Seat[]): SeatMapLayout {
  const seatsByLocation = new Map<string, Seat>()
  for (const seat of seats) {
    seatsByLocation.set(`${seat.section}|${seat.row}|${seat.number}`, seat)
  }

  let columns = 0

  const sections: SeatSection[] = venue.sections.map((section, sectionIndex) => {
    const centerGap =
      section.seatsPerRow >= CENTRE_AISLE_MIN_WIDTH ? CENTRE_AISLE_COLUMNS : 0
    const leftCount =
      centerGap === 0
        ? section.seatsPerRow
        : Math.ceil((section.seatsPerRow - centerGap) / 2)

    const rows: SeatRow[] = section.rows.map((rowLabel, rowIndex) => {
      const rowSeats: Seat[] = []
      for (let number = 1; number <= section.seatsPerRow; number += 1) {
        const seat = seatsByLocation.get(`${section.code}|${rowLabel}|${number}`)
        if (seat) rowSeats.push(seat)
      }

      const indent = staggerFor(sectionIndex, rowIndex)
      columns = Math.max(columns, indent + leftCount + centerGap + (rowSeats.length - leftCount))

      return { sectionCode: section.code, rowLabel, seats: rowSeats, indent, centerGap, leftCount }
    })

    const sectionSeats = rows.flatMap((row) => row.seats)

    return {
      code: section.code,
      name: section.name,
      tierName: section.tierName,
      price: section.price,
      rows,
      total: sectionSeats.length,
      available: sectionSeats.filter((seat) => seat.status === 'AVAILABLE').length,
    }
  })

  const categoryMap = new Map<string, SeatCategoryInfo>()
  for (const section of venue.sections) {
    const remaining = seats.filter(
      (seat) => seat.section === section.code && seat.status === 'AVAILABLE',
    ).length
    categoryMap.set(section.tierName, {
      tierName: section.tierName,
      price: section.price,
      currency: 'INR',
      remaining,
    })
  }

  return {
    sections,
    categories: [...categoryMap.values()].sort((a, b) => b.price - a.price),
    columns: Math.max(columns, 1),
    totals: {
      total: seats.length,
      available: seats.filter((seat) => seat.status === 'AVAILABLE').length,
      locked: seats.filter((seat) => seat.status === 'LOCKED').length,
      booked: seats.filter((seat) => seat.status === 'BOOKED').length,
      blocked: seats.filter((seat) => seat.status === 'BLOCKED').length,
    },
  }
}

/**
 * Alternate rows by a single column so each block reads as a raked block rather
 * than a spreadsheet. Back sections get an extra column of inset.
 */
function staggerFor(sectionIndex: number, rowIndex: number): number {
  if (sectionIndex === 0) return rowIndex % 2
  return (rowIndex % 2) + (sectionIndex > 2 ? 1 : 0)
}

/**
 * Maps a seat's position inside its row to a CSS grid column.
 * Column 1 is reserved for the row label.
 */
export function gridColumnFor(row: SeatRow, index: number): number {
  return index < row.leftCount ? index + 2 : index + row.centerGap + 2
}

/** `A · Row F · Seat 12` — the canonical seat label. */
export function seatLabel(seat: Pick<Seat, 'section' | 'row' | 'number'>): string {
  return `${seat.section}-${seat.row}-${seat.number}`
}

/** Human-facing seat description used in tooltips and summaries. */
export function seatDescription(seat: Pick<Seat, 'section' | 'row' | 'number'>): string {
  return `${seat.section} · Row ${seat.row} · Seat ${seat.number}`
}