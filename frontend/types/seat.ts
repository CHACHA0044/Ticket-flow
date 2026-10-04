/**
 * Seat domain model.
 * Mirrors the `seats` collection (SRS FR-SEAT-02) — the single most
 * concurrency-sensitive entity in the system.
 */

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'BLOCKED'

export const SEAT_STATUS_LABEL: Record<SeatStatus, string> = {
  AVAILABLE: 'Available',
  LOCKED: 'Held by another user',
  BOOKED: 'Sold',
  BLOCKED: 'Unavailable',
}

export interface Seat {
  id: string
  eventId: string
  section: string
  row: string
  number: number
  category: string
  price: number
  status: SeatStatus
  /** OCC version counter (FR-CONC-02). Incremented on every transition. */
  version: number
  /** Present only when `status === 'LOCKED'`. */
  lockedByCurrentUser?: boolean
  /** Epoch ms after which a LOCKED seat returns to AVAILABLE (FR-BOOK-03). */
  lockExpiresAt?: number
  /** Wheelchair / companion seating marker. */
  accessible?: boolean
}

/** Section + row + geometry, derived from the venue layout. */
export interface SeatRow {
  sectionCode: string
  rowLabel: string
  seats: Seat[]
  /** Leading empty columns — staggers blocks the way real venue plans do. */
  indent: number
  /** Empty columns reserved in the middle of the row (centre aisle). */
  centerGap: number
  /** Number of seats rendered before `centerGap`. */
  leftCount: number
}

export interface SeatSection {
  code: string
  name: string
  tierName: string
  price: number
  rows: SeatRow[]
  /** Aggregate for the legend and for the section summary. */
  total: number
  available: number
}

export interface SeatCategoryInfo {
  tierName: string
  price: number
  currency: string
  /** Per-section availability roll-up. */
  remaining: number
}

/**
 * Immutable snapshot fetched over REST; the source of truth on first paint.
 *
 * The payload is deliberately a flat seat list — the render model (sections,
 * rows, aisle geometry) is derived client-side in `lib/seats/layout.ts` so the
 * wire format stays minimal and cacheable.
 */
export interface SeatAvailabilitySnapshot {
  eventId: string
  eventTitle: string
  seats: Seat[]
  totals: {
    total: number
    available: number
    locked: number
    booked: number
    blocked: number
  }
  /** Event-level hold deadline for the requesting user's pending booking. */
  holdExpiresAt: number | null
  /** Server timestamp — lets the client detect clock skew before locking. */
  serverTime: number
}

/* ──────────────────────────────────────────────────────────────────────────
   Real-time payloads
   FR-RT-03 mandates a minimal shape broadcast to room `event:<eventId>`.
   ────────────────────────────────────────────────────────────────────────── */

export interface SeatUpdateEvent {
  eventId: string
  seatId: string
  status: SeatStatus
  /** OCC version after the transition — lets clients drop stale updates. */
  version: number
  /** Present for LOCKED transitions. */
  expiresAt?: number
  /** Optimistic-concurrency version of the booking that owns the lock. */
  bookingNumber?: string
  timestamp: number
}

export interface SeatBatchUpdateEvent {
  eventId: string
  updates: SeatUpdateEvent[]
  timestamp: number
}

export type SeatRealtimeEvent = SeatUpdateEvent | SeatBatchUpdateEvent

/** Discriminates the two shapes above without a schema library. */
export function isBatchUpdate(event: SeatRealtimeEvent): event is SeatBatchUpdateEvent {
  return 'updates' in event
}