import type { Event } from '@/types/event'
import type { Seat } from '@/types/seat'

/**
 * Deterministic seat generation for the mock dataset.
 *
 * Mirrors the `seats` collection exactly (section / row / number / category /
 * price / status / version) so the shape of the data — not just its contents —
 * matches what the MongoDB backend will return.
 */
export function generateSeats(event: Event): Seat[] {
  const { venue, soldPercentage } = event
  const soldRatio = soldPercentage / 100

  // Availability tightens as the event approaches, exactly like a real on-sale.
  const daysOut = (new Date(event.startTime).getTime() - Date.now()) / 86_400_000
  const urgencyBoost = daysOut <= 3 ? 0.12 : daysOut <= 7 ? 0.06 : 0
  const targetSoldRatio = Math.min(1, soldRatio + urgencyBoost)

  const seats: Seat[] = []
  const now = Date.now()

  venue.sections.forEach((section) => {
    const accessible = new Set(
      (section.accessibleSeats ?? []).map((position) => `${position.row}:${position.seatNumber}`),
    )

    section.rows.forEach((row, rowIndex) => {
      // Slight per-row variance keeps availability from looking synthetic.
      const rowBias = ((rowIndex * 37) % 11) / 100 - 0.05

      for (let number = 1; number <= section.seatsPerRow; number += 1) {
        const id = `${event.id}:${section.code}:${row}:${number}`
        const hash = hashUnit(`${id}:${event.id}`)
        const isAccessible = accessible.has(`${row}:${number}`)

        let status: Seat['status'] = 'AVAILABLE'
        let lockExpiresAt: number | undefined

        if (isAccessible) {
          // Accessible bays are protected from bulk allocation.
          status = hash > 0.72 ? 'BOOKED' : 'AVAILABLE'
        } else if (hash < targetSoldRatio - rowBias) {
          status = 'BOOKED'
        } else if (hash > 0.985) {
          // A handful of seats are mid-hold by other buyers right now.
          status = 'LOCKED'
          lockExpiresAt = now + Math.round(hash * 100_000) + 30_000
        } else if (hash > 0.978) {
          status = 'BLOCKED'
        }

        const seat: Seat = {
          id,
          eventId: event.id,
          section: section.code,
          row,
          number,
          category: section.tierName,
          price: section.price,
          status,
          version: status === 'AVAILABLE' ? 1 : 2,
        }

        if (isAccessible) seat.accessible = true
        if (lockExpiresAt !== undefined) seat.lockExpiresAt = lockExpiresAt
        seats.push(seat)
      }
    })
  })

  return seats
}

/** Deterministic 0–1 value derived from a string. */
function hashUnit(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10_000) / 10_000
}

export interface SeatTotals {
  total: number
  available: number
  locked: number
  booked: number
  blocked: number
}

export function seatTotals(seats: Seat[]): SeatTotals {
  return {
    total: seats.length,
    available: seats.filter((seat) => seat.status === 'AVAILABLE').length,
    locked: seats.filter((seat) => seat.status === 'LOCKED').length,
    booked: seats.filter((seat) => seat.status === 'BOOKED').length,
    blocked: seats.filter((seat) => seat.status === 'BLOCKED').length,
  }
}