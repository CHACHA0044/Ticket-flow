import type { Booking, BookingItem, ConfirmBookingInput } from '@/types/booking'
import type { Seat } from '@/types/seat'
import type { BookingPreferences, User } from '@/types/user'
import { ApiError } from '@/types/api'
import { MAX_SEATS_PER_BOOKING, SEAT_HOLD_TTL_SECONDS } from '@/lib/constants'
import { buildPriceBreakdown } from '@/lib/booking/pricing'
import { DEFAULT_PREFERENCES, MOCK_USERS } from './users'
import { createSeededRng } from './random'
import { EVENTS } from './events'
import { generateSeats, seatTotals } from './seats'
import { DEMO_BOOKING_SEEDS, type DemoBookingSeed } from './bookings-seed'
import { daysFromNow } from './clock'

/**
 * In-memory stand-in for MongoDB + Redis.
 *
 * Holds the only mutable copy of seat state so that a hold created through a
 * route handler is immediately visible to a later Server Component render — the
 * same consistency a real database provides. It is a development scaffold only:
 * swapping in `MongoDB` + `SET NX PX` locking means replacing this file and the
 * services that wrap it, with no UI changes.
 */

interface SeatLockRecord {
  key: string
  eventId: string
  seatId: string
  userId: string
  bookingId: string
  lockToken: string
  acquiredAt: number
  expiresAt: number
}

export interface CreateBookingRequest {
  userId: string
  eventId: string
  seatIds: string[]
  /** Retry token. See `findBookingByIdempotencyKey`. */
  idempotencyKey?: string
}

export interface Store {
  seatsByEvent: Map<string, Seat[]>
  seatIndex: Map<string, Seat>
  bookings: Map<string, Booking>
  locksBySeat: Map<string, SeatLockRecord>
  users: Map<string, User>
  preferences: Map<string, BookingPreferences>
  bookingCounter: number
}

function lockKey(eventId: string, seatId: string): string {
  return `lock:event:${eventId}:seat:${seatId}`
}

function seatKey(eventId: string, seatId: string): string {
  return `${eventId}::${seatId}`
}

function createStore(): Store {
  const store: Store = {
    seatsByEvent: new Map(),
    seatIndex: new Map(),
    bookings: new Map(),
    locksBySeat: new Map(),
    users: new Map(MOCK_USERS.map((user) => [user.id, { ...user }])),
    preferences: new Map(),
    bookingCounter: 4820,
  }

  for (const event of EVENTS) {
    const seats = generateSeats(event)
    store.seatsByEvent.set(event.id, seats)
    for (const seat of seats) store.seatIndex.set(seatKey(event.id, seat.id), seat)
  }

  for (const user of store.users.values()) {
    store.preferences.set(user.id, { ...DEFAULT_PREFERENCES })
  }

  // Seed demo bookings, then mark their seats sold so the catalogue, the seat
  // maps and the booking history all agree with each other.
  for (const seed of DEMO_BOOKING_SEEDS) {
    const booking = buildSeedBooking(store, seed)
    store.bookings.set(booking.id, booking)
    applySeatsAsBooked(store, booking)
  }

  return store
}

/** Assembles a `Booking` from a descriptor plus a deterministic seat pick. */
function buildSeedBooking(store: Store, seed: DemoBookingSeed): Booking {
  const event = EVENTS.find((candidate) => candidate.id === seed.eventId)
  if (!event) {
    throw new Error(`Mock dataset integrity error: unknown event "${seed.eventId}"`)
  }

  const pool = store.seatsByEvent.get(event.id) ?? []
  const start = seed.seatOffset % Math.max(1, pool.length - seed.seatCount)
  const picked = pool.slice(start, start + seed.seatCount)

  const items: BookingItem[] = picked.map((seat, index) => ({
    id: `${seed.id}-item-${index + 1}`,
    bookingId: seed.id,
    seatId: seat.id,
    section: seat.section,
    row: seat.row,
    seatNumber: seat.number,
    tierName: seat.category,
    unitPrice: seat.price,
    ticketBarcode: `TF${seed.id.replace(/\D/g, '').slice(-9)}I${index + 1}`,
    status: seed.status === 'CANCELLED' ? 'VOIDED' : 'ACTIVE',
  }))

  return {
    id: seed.id,
    bookingNumber: `TF-2026-${seed.id.replace(/\D/g, '').slice(-5)}`,
    userId: seed.userId,
    eventId: event.id,
    eventTitle: event.title,
    eventCategory: event.category,
    eventStartTime: event.startTime,
    venueName: event.venue.name,
    venueLocality: `${event.venue.locality}, ${event.venue.city}`,
    venueCity: event.venue.city,
    items,
    pricing: buildPriceBreakdown(
      items.map((item) => ({
        id: item.seatId,
        tierName: item.tierName,
        section: item.section,
        row: item.row,
        seatNumber: item.seatNumber,
        price: item.unitPrice,
      })),
    ),
    status: seed.status,
    expiresAt: null,
    createdAt: daysFromNow(seed.createdOffsetDays),
    confirmedAt:
      seed.status === 'PENDING'
        ? null
        : daysFromNow(seed.confirmedOffsetDays ?? seed.createdOffsetDays),
  }
}

function applySeatsAsBooked(store: Store, booking: Booking): void {
  if (booking.status !== 'CONFIRMED') return
  for (const item of booking.items) {
    const seat = store.seatIndex.get(seatKey(booking.eventId, item.seatId))
    if (!seat) continue
    seat.status = 'BOOKED'
    seat.version += 1
  }
}

const globalStore = globalThis as typeof globalThis & { __ticketFlowStore?: Store }

/** Survives Next.js hot-reloads in development. */
export function getStore(): Store {
  if (!globalStore.__ticketFlowStore) {
    globalStore.__ticketFlowStore = createStore()
  }
  return globalStore.__ticketFlowStore
}

/** FR-BOOK-03 / FR-REL-02 — expired holds revert to AVAILABLE and expire the booking. */
export function sweepExpiredLocks(store: Store): void {
  const now = Date.now()
  for (const [key, lock] of store.locksBySeat) {
    if (lock.expiresAt > now) continue
    store.locksBySeat.delete(key)
    const seat = store.seatIndex.get(seatKey(lock.eventId, lock.seatId))
    if (seat && seat.status === 'LOCKED') {
      seat.status = 'AVAILABLE'
      seat.version += 1
      delete seat.lockExpiresAt
    }
    const booking = store.bookings.get(lock.bookingId)
    if (booking && booking.status === 'PENDING') {
      booking.status = 'EXPIRED'
    }
  }
}

export function getEventSeats(store: Store, eventId: string): Seat[] {
  sweepExpiredLocks(store)
  return store.seatsByEvent.get(eventId) ?? []
}

export function getSeatTotals(store: Store, eventId: string) {
  return seatTotals(getEventSeats(store, eventId))
}

function nextBookingNumber(store: Store): string {
  store.bookingCounter += 1
  const year = new Date().getFullYear()
  return `TF-${year}-${store.bookingCounter.toString().padStart(5, '0')}`
}

function makeBarcode(bookingId: string, seatId: string): string {
  return `TF${createSeededRng(`${bookingId}:${seatId}`)().toString().slice(2, 14).padEnd(12, '0')}`
}

/**
 * FR-BOOK-02 — acquires the distributed hold for every requested seat.
 *
 * All-or-nothing: if a single seat cannot be locked, every lock already taken
 * in this request is released before the 409 is thrown. This mirrors the
 * Redis lock + MongoDB OCC rollback described in /docs/database §3.
 */
export function createPendingBooking(store: Store, request: CreateBookingRequest): Booking {
  const { userId, eventId, seatIds, idempotencyKey } = request
  const event = EVENTS.find((candidate) => candidate.id === eventId)
  if (!event) throw new ApiError('NOT_FOUND', 'Event not found.', 404)

  if (seatIds.length === 0) throw new ApiError('VALIDATION_FAILED', 'Select at least one seat.', 400)
  if (seatIds.length > MAX_SEATS_PER_BOOKING) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `A maximum of ${MAX_SEATS_PER_BOOKING} seats can be booked per transaction.`,
      400,
    )
  }

  sweepExpiredLocks(store)

  const uniqueSeatIds = [...new Set(seatIds)]
  if (uniqueSeatIds.length !== seatIds.length) {
    throw new ApiError('VALIDATION_FAILED', 'Duplicate seats in request.', 400)
  }

  /*
   * Idempotent replay (FR-BOOK-02).
   *
   * A retry — double-tap, flaky mobile connection, client-side refetch — must not
   * be treated as a second intent to buy. Without this the retry loses the race
   * against its own first attempt and surfaces as a misleading "seat just taken"
   * error, even though the hold the user is paying for is still alive.
   *
   * The real system enforces this with a unique index on (userId,
   * idempotencyKey); here it is a scan, which is fine for an in-memory store.
   */
  if (idempotencyKey) {
    const replay = findLiveBookingByIdempotencyKey(store, userId, idempotencyKey)
    if (replay) return replay
  }

  const bookingId = `bkg-${Date.now().toString(36)}-${createSeededRng(String(Date.now()))()
    .toString(36)
    .slice(2, 7)}`

  const acquired: SeatLockRecord[] = []
  const expiresAt = Date.now() + SEAT_HOLD_TTL_SECONDS * 1000

  for (const seatId of uniqueSeatIds) {
    const seat = store.seatIndex.get(seatKey(eventId, seatId))
    if (!seat) {
      releaseAcquired(store, acquired)
      throw new ApiError('NOT_FOUND', `Seat ${seatId} does not exist for this event.`, 404)
    }

    const existing = store.locksBySeat.get(lockKey(eventId, seatId))
    if (existing || seat.status !== 'AVAILABLE') {
      releaseAcquired(store, acquired)
      throw new ApiError(
        'SEAT_UNAVAILABLE',
        `Seat ${seat.section}-${seat.row}-${seat.number} was just taken. Pick another.`,
        409,
        { seatId },
      )
    }

    const record: SeatLockRecord = {
      key: lockKey(eventId, seatId),
      eventId,
      seatId,
      userId,
      bookingId,
      lockToken: createSeededRng(`${eventId}:${seatId}:${expiresAt}`)().toString(36).slice(2, 14),
      acquiredAt: Date.now(),
      expiresAt,
    }

    // `SET NX PX` semantics — the key must not already exist.
    if (store.locksBySeat.has(record.key)) {
      releaseAcquired(store, acquired)
      throw new ApiError('SEAT_UNAVAILABLE', 'Seat is held by another buyer.', 409, { seatId })
    }
    store.locksBySeat.set(record.key, record)

    seat.status = 'LOCKED'
    seat.version += 1
    seat.lockExpiresAt = expiresAt
    acquired.push(record)
  }

  const nowIso = new Date().toISOString()
  const items: BookingItem[] = acquired.map((record, index) => {
    const seat = store.seatIndex.get(seatKey(eventId, record.seatId))
    const resolvedSeat = seat as Seat
    return {
      id: `${bookingId}-item-${index + 1}`,
      bookingId,
      seatId: resolvedSeat.id,
      section: resolvedSeat.section,
      row: resolvedSeat.row,
      seatNumber: resolvedSeat.number,
      tierName: resolvedSeat.category,
      unitPrice: resolvedSeat.price,
      ticketBarcode: makeBarcode(bookingId, resolvedSeat.id),
      status: 'ACTIVE',
    }
  })

  const pricing = buildPriceBreakdown(
    items.map((item) => ({
      id: item.seatId,
      tierName: item.tierName,
      section: item.section,
      row: item.row,
      seatNumber: item.seatNumber,
      price: item.unitPrice,
    })),
  )

  const booking: Booking = {
    id: bookingId,
    bookingNumber: nextBookingNumber(store),
    userId,
    eventId,
    eventTitle: event.title,
    eventCategory: event.category,
    eventStartTime: event.startTime,
    venueName: event.venue.name,
    venueLocality: `${event.venue.locality}, ${event.venue.city}`,
    venueCity: event.venue.city,
    items,
    pricing,
    status: 'PENDING',
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: nowIso,
    confirmedAt: null,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  }

  store.bookings.set(bookingId, booking)
  return booking
}

/**
 * Returns the live PENDING booking created with this retry token, if any.
 *
 * Only PENDING holds replay: once a booking is confirmed or cancelled the key is
 * spent, so a later create with the same token is a genuinely new intent and must
 * be allowed to acquire seats. Expired holds do not replay either — the caller
 * should get a fresh hold (and fresh seats if the old ones are gone).
 */
function findLiveBookingByIdempotencyKey(
  store: Store,
  userId: string,
  idempotencyKey: string,
): Booking | undefined {
  const now = Date.now()

  for (const booking of store.bookings.values()) {
    if (booking.userId !== userId || booking.idempotencyKey !== idempotencyKey) continue
    if (booking.status !== 'PENDING') continue
    if (!booking.expiresAt || new Date(booking.expiresAt).getTime() <= now) continue
    return booking
  }

  return undefined
}

function releaseAcquired(store: Store, records: SeatLockRecord[]): void {
  for (const record of records) {
    store.locksBySeat.delete(record.key)
    const seat = store.seatIndex.get(seatKey(record.eventId, record.seatId))
    if (seat && seat.status === 'LOCKED') {
      seat.status = 'AVAILABLE'
      seat.version += 1
      delete seat.lockExpiresAt
    }
  }
}

/** FR-BOOK-04 — commits the hold into a confirmed booking. */
export function confirmBooking(
  store: Store,
  userId: string,
  bookingId: string,
  input: ConfirmBookingInput,
): { booking: Booking; transactionRef: string } {
  const booking = store.bookings.get(bookingId)
  if (!booking || booking.userId !== userId) {
    throw new ApiError('NOT_FOUND', 'Booking not found.', 404)
  }

  sweepExpiredLocks(store)

  if (booking.status === 'EXPIRED') {
    throw new ApiError('LOCK_EXPIRED', 'Your seat hold expired. Please select seats again.', 409)
  }
  if (booking.status === 'CONFIRMED') {
    throw new ApiError('CONFLICT', 'This booking is already confirmed.', 409)
  }
  if (booking.status === 'CANCELLED') {
    throw new ApiError('CONFLICT', 'This booking was cancelled.', 409)
  }

  for (const item of booking.items) {
    const lock = store.locksBySeat.get(lockKey(booking.eventId, item.seatId))
    if (!lock) {
      throw new ApiError('LOCK_EXPIRED', 'Your seat hold expired before payment completed.', 409)
    }
  }

  const transactionRef = `pi_test_${createSeededRng(
    `${bookingId}:${input.paymentMethod}:${input.billing.email}`,
  )()
    .toString(36)
    .slice(2, 16)}`

  for (const item of booking.items) {
    const lock = store.locksBySeat.get(lockKey(booking.eventId, item.seatId))
    if (lock) store.locksBySeat.delete(lock.key)
    const seat = store.seatIndex.get(seatKey(booking.eventId, item.seatId))
    if (seat) {
      seat.status = 'BOOKED'
      seat.version += 1
      delete seat.lockExpiresAt
    }
  }

  booking.status = 'CONFIRMED'
  booking.confirmedAt = new Date().toISOString()
  booking.expiresAt = null

  return { booking, transactionRef }
}

/** FR-BOOK-06 — cancels a booking and releases its inventory. */
export function cancelBooking(store: Store, userId: string, bookingId: string): Booking {
  const booking = store.bookings.get(bookingId)
  if (!booking || booking.userId !== userId) {
    throw new ApiError('NOT_FOUND', 'Booking not found.', 404)
  }
  if (booking.status === 'CANCELLED') return booking

  const restoreToAvailable = booking.status !== 'CONFIRMED'
  for (const item of booking.items) {
    const key = lockKey(booking.eventId, item.seatId)
    store.locksBySeat.delete(key)
    const seat = store.seatIndex.get(seatKey(booking.eventId, item.seatId))
    if (!seat) continue
    seat.status = restoreToAvailable ? 'AVAILABLE' : seat.status
    seat.version += 1
    delete seat.lockExpiresAt
    item.status = 'VOIDED'
  }

  booking.status = 'CANCELLED'
  return booking
}

export function listBookingsForUser(store: Store, userId: string): Booking[] {
  sweepExpiredLocks(store)
  return [...store.bookings.values()]
    .filter((booking) => booking.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getBookingForUser(
  store: Store,
  userId: string,
  bookingId: string,
): Booking {
  const booking = store.bookings.get(bookingId)
  if (!booking || booking.userId !== userId) {
    throw new ApiError('NOT_FOUND', 'Booking not found.', 404)
  }
  return booking
}

/** Remaining seconds on the hold, or `null` when nothing is pending. */
export function activeHoldExpiresAt(store: Store, userId: string): number | null {
  sweepExpiredLocks(store)
  const pending = [...store.bookings.values()].find(
    (booking) => booking.userId === userId && booking.status === 'PENDING' && booking.expiresAt,
  )
  if (!pending?.expiresAt) return null
  const remaining = new Date(pending.expiresAt).getTime() - Date.now()
  return remaining > 0 ? remaining : null
}

export function userExists(store: Store, userId: string): boolean {
  return store.users.has(userId)
}

export function getUser(store: Store, userId: string): User {
  const user = store.users.get(userId)
  if (!user) throw new ApiError('NOT_FOUND', 'User not found.', 404)
  return user
}

export function getPreferences(store: Store, userId: string): BookingPreferences {
  return store.preferences.get(userId) ?? { ...DEFAULT_PREFERENCES }
}

export function updatePreferences(
  store: Store,
  userId: string,
  patch: Partial<BookingPreferences>,
): BookingPreferences {
  const next = { ...getPreferences(store, userId), ...patch }
  store.preferences.set(userId, next)
  return next
}

export function registerUser(
  store: Store,
  input: { fullName: string; email: string; phone?: string },
): User {
  const email = input.email.toLowerCase()
  const existing = [...store.users.values()].find((user) => user.email === email)
  if (existing) return existing

  const user: User = {
    id: `usr-${Math.abs(hashString(email)).toString(36)}`,
    email,
    fullName: input.fullName,
    role: 'CUSTOMER',
    phone: input.phone ?? null,
    createdAt: new Date().toISOString(),
  }
  store.users.set(user.id, user)
  store.preferences.set(user.id, { ...DEFAULT_PREFERENCES })
  return user
}

export function authenticateUser(store: Store, email: string, password: string): User {
  const user = [...store.users.values()].find(
    (candidate) => candidate.email === email.toLowerCase(),
  )
  // Demo credentials: any password of 8+ characters is accepted for a known
  // address. A real implementation delegates to the Express/JWT backend.
  if (!user || password.length < 8) {
    throw new ApiError('UNAUTHORIZED', 'Incorrect email or password.', 401)
  }
  return user
}

function hashString(value: string): number {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0
  return hash
}