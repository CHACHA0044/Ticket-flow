/**
 * Booking domain model.
 * Mirrors `bookings`, `bookingItems` and `payments`.
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Hold expired',
}

export type BookingItemStatus = 'ACTIVE' | 'VOIDED' | 'USED'

export interface BookingItem {
  id: string
  bookingId: string
  seatId: string
  section: string
  row: string
  seatNumber: number
  tierName: string
  unitPrice: number
  /** Unique verifiable gate token (FR-BOOK-04). */
  ticketBarcode: string
  status: BookingItemStatus
}

/** Line-itemised invoice rendered by <PriceBreakdown />. */
export interface PriceLine {
  id: string
  label: string
  detail?: string
  quantity: number
  unitPrice: number
  amount: number
  /** Emphasised line = the number the customer actually pays. */
  emphasis?: 'total' | 'muted'
}

export interface PriceBreakdown {
  lines: PriceLine[]
  subtotal: number
  convenienceFee: number
  platformFee: number
  taxes: number
  total: number
  currency: string
}

export interface Booking {
  id: string
  /** Human readable code, e.g. `TF-2026-89712`. */
  bookingNumber: string
  userId: string
  eventId: string
  eventTitle: string
  eventCategory: string
  eventStartTime: string
  venueName: string
  venueLocality: string
  venueCity: string
  items: BookingItem[]
  pricing: PriceBreakdown
  status: BookingStatus
  /** Checkout deadline for a PENDING booking (FR-BOOK-02). */
  expiresAt: string | null
  createdAt: string
  confirmedAt: string | null
  /**
   * Client-supplied retry token (FR-BOOK-02). A repeated create with the same
   * key replays the original hold instead of acquiring a second one.
   */
  idempotencyKey?: string
}

export interface BookingListItem {
  id: string
  bookingNumber: string
  eventId: string
  eventTitle: string
  posterHue: number
  posterAccentHue: number
  posterMotif: 'arc' | 'chevron' | 'grid' | 'orbit' | 'wave'
  eventStartTime: string
  venueName: string
  venueLocality: string
  seatCount: number
  seatLabels: string[]
  totalAmount: number
  status: BookingStatus
  createdAt: string
  isUpcoming: boolean
}

/** Request body for POST /api/bookings (seat hold). */
export interface CreateBookingInput {
  eventId: string
  seatIds: string[]
  /** Idempotency key — protects against duplicate holds on retry. */
  idempotencyKey?: string
}

export interface CreateBookingResult {
  booking: Booking
  /** Seconds remaining on the distributed lock lease. */
  ttlSeconds: number
}

export type PaymentMethodKind = 'CARD' | 'UPI' | 'NETBANKING'

export interface PaymentMethod {
  kind: PaymentMethodKind
  label: string
  description: string
  /** Test-mode instrument descriptor, never a real credential. */
  instrument: string
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    kind: 'CARD',
    label: 'Card',
    description: 'Visa / Mastercard sandbox token',
    instrument: '4242 4242 4242 4242',
  },
  {
    kind: 'UPI',
    label: 'UPI',
    description: 'Test-mode UPI intent',
    instrument: 'success@tfpay',
  },
  {
    kind: 'NETBANKING',
    label: 'Net banking',
    description: 'Sandbox bank redirect',
    instrument: 'HDFC · test',
  },
] as const

export interface ConfirmBookingInput {
  bookingId: string
  paymentMethod: PaymentMethodKind
  billing: {
    fullName: string
    email: string
    phone: string
  }
}

export interface PaymentResult {
  transactionRef: string
  status: 'SUCCESS' | 'FAILED'
  gateway: 'STRIPE_TEST' | 'RAZORPAY_TEST'
}