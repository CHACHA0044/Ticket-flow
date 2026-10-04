import type { Booking, BookingListItem } from '@/types/booking'
import { EVENTS } from './events'

/**
 * Pure descriptor data for the demo account's booking history.
 *
 * Kept free of any store access so it can be consumed by `store.ts` without
 * creating an import cycle; the actual `Booking` records are assembled there.
 */
export interface DemoBookingSeed {
  id: string
  userId: string
  eventId: string
  status: Booking['status']
  /** Days relative to today when the booking was created. */
  createdOffsetDays: number
  /** Days relative to today when payment settled; null while still pending. */
  confirmedOffsetDays: number | null
  /** Index into the event's seat list — keeps the demo seats deterministic. */
  seatOffset: number
  seatCount: number
}

export const DEMO_BOOKING_SEEDS: DemoBookingSeed[] = [
  {
    id: 'bkg-demo-9001',
    userId: 'usr-2300100925',
    eventId: 'evt-qubit-workshop',
    status: 'CONFIRMED',
    createdOffsetDays: -12,
    confirmedOffsetDays: -12,
    seatOffset: 3,
    seatCount: 2,
  },
  {
    id: 'bkg-demo-9002',
    userId: 'usr-2300100925',
    eventId: 'evt-midnight-meridian',
    status: 'CONFIRMED',
    createdOffsetDays: -5,
    confirmedOffsetDays: -5,
    seatOffset: 61,
    seatCount: 3,
  },
  {
    id: 'bkg-demo-9003',
    userId: 'usr-2300100925',
    eventId: 'evt-ironline-fc',
    status: 'CONFIRMED',
    createdOffsetDays: -9,
    confirmedOffsetDays: -9,
    seatOffset: 140,
    seatCount: 4,
  },
  {
    id: 'bkg-demo-9004',
    userId: 'usr-2300100925',
    eventId: 'evt-colloquium',
    status: 'CONFIRMED',
    createdOffsetDays: -40,
    confirmedOffsetDays: -40,
    seatOffset: 12,
    seatCount: 2,
  },
  {
    id: 'bkg-demo-9005',
    userId: 'usr-2300100925',
    eventId: 'evt-neon-signal',
    status: 'CANCELLED',
    createdOffsetDays: -18,
    confirmedOffsetDays: -18,
    seatOffset: 205,
    seatCount: 2,
  },
  {
    id: 'bkg-demo-9010',
    userId: 'usr-demo-buyer',
    eventId: 'evt-mahabharat',
    status: 'CONFIRMED',
    createdOffsetDays: -7,
    confirmedOffsetDays: -7,
    seatOffset: 18,
    seatCount: 2,
  },
  {
    id: 'bkg-demo-9011',
    userId: 'usr-demo-buyer',
    eventId: 'evt-silverline',
    status: 'CONFIRMED',
    createdOffsetDays: -3,
    confirmedOffsetDays: -3,
    seatOffset: 88,
    seatCount: 2,
  },
]

/** Compact row model for the /bookings list. */
export function toListItem(booking: Booking, now = new Date().toISOString()): BookingListItem {
  const event = EVENTS.find((candidate) => candidate.id === booking.eventId)
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    posterHue: event?.poster.hue ?? 40,
    posterAccentHue: event?.poster.accentHue ?? 45,
    posterMotif: event?.poster.motif ?? 'arc',
    eventStartTime: booking.eventStartTime,
    venueName: booking.venueName,
    venueLocality: booking.venueLocality,
    seatCount: booking.items.length,
    seatLabels: booking.items.map((item) => `${item.section}-${item.row}${item.seatNumber}`),
    totalAmount: booking.pricing.total,
    status: booking.status,
    createdAt: booking.createdAt,
    isUpcoming: booking.status === 'CONFIRMED' && new Date(booking.eventStartTime) > new Date(now),
  }
}