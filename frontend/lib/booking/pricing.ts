import {
  CONVENIENCE_FEE_PER_TICKET,
  CURRENCY,
  GST_RATE,
  PLATFORM_FEE_RATE,
} from '@/lib/constants'
import type { PriceBreakdown, PriceLine } from '@/types/booking'

export interface PriceableSeat {
  id: string
  tierName: string
  section: string
  row: string
  seatNumber: number
  price: number
}

function round(value: number): number {
  return Math.round(value)
}

/** Sum of seat face values only — what the customer sees before fees. */
export function calculateSeatSubtotal(seats: { price: number }[]): number {
  return round(seats.reduce((sum, seat) => sum + seat.price, 0))
}

/**
 * Builds the invoice for a seat selection.
 *
 * Mirrors the fee structure the backend will own; kept here so checkout can
 * render before a backend exists, and so the identical helper can be re-used
 * by server components for an authoritative total.
 */
export function buildPriceBreakdown(seats: PriceableSeat[]): PriceBreakdown {
  const grouped = new Map<string, { seats: PriceableSeat[]; unitPrice: number }>()

  for (const seat of seats) {
    const bucket = grouped.get(seat.tierName)
    if (bucket) {
      bucket.seats.push(seat)
    } else {
      grouped.set(seat.tierName, { seats: [seat], unitPrice: seat.price })
    }
  }

  const seatLines: PriceLine[] = [...grouped.entries()].map(([tierName, bucket]) => ({
    id: `tier:${tierName}`,
    label: tierName,
    detail: bucket.seats
      .slice(0, 4)
      .map((seat) => `${seat.section} · ${seat.row}${seat.seatNumber}`)
      .join('   '),
    quantity: bucket.seats.length,
    unitPrice: bucket.unitPrice,
    amount: bucket.unitPrice * bucket.seats.length,
  }))

  const subtotal = round(seats.reduce((sum, seat) => sum + seat.price, 0))
  const convenienceFee = round(seats.length * CONVENIENCE_FEE_PER_TICKET)
  const platformFee = round(subtotal * PLATFORM_FEE_RATE)
  const taxes = round((convenienceFee + platformFee) * GST_RATE)
  const total = subtotal + convenienceFee + platformFee + taxes

  return {
    lines: [
      ...seatLines,
      {
        id: 'fee:convenience',
        label: 'Convenience fee',
        detail: `₹${CONVENIENCE_FEE_PER_TICKET} per ticket`,
        quantity: seats.length,
        unitPrice: CONVENIENCE_FEE_PER_TICKET,
        amount: convenienceFee,
        emphasis: 'muted',
      },
      {
        id: 'fee:platform',
        label: 'Platform fee',
        detail: `${(PLATFORM_FEE_RATE * 100).toFixed(0)}% of ticket value`,
        quantity: 1,
        unitPrice: platformFee,
        amount: platformFee,
        emphasis: 'muted',
      },
      {
        id: 'fee:taxes',
        label: 'GST',
        detail: `${(GST_RATE * 100).toFixed(0)}% on fees`,
        quantity: 1,
        unitPrice: taxes,
        amount: taxes,
        emphasis: 'muted',
      },
    ],
    subtotal,
    convenienceFee,
    platformFee,
    taxes,
    total,
    currency: CURRENCY,
  }
}