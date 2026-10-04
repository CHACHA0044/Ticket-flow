import 'server-only'
import type { AdminDashboardData } from '@/types/admin'
import type {
  Booking,
  BookingListItem,
  ConfirmBookingInput,
  CreateBookingInput,
  CreateBookingResult,
} from '@/types/booking'
import type { Event, EventFilters, EventSummary } from '@/types/event'
import type { SeatAvailabilitySnapshot } from '@/types/seat'
import type { BookingPreferences, LoginInput, RegisterInput, User, UserProfile } from '@/types/user'
import type { Paginated, RequestOptions } from '@/types/api'
import { ApiError } from '@/types/api'
import type {
  AdminService,
  BookingService,
  EventService,
  SeatService,
  Services,
  UserService,
} from './contracts'
import { applyEventFilters } from './catalog'
import { buildMockAdminDashboard } from '@/lib/mock/admin'
import { getSessionUserId } from '@/lib/auth/session'
import { toListItem } from '@/lib/mock/bookings-seed'
import { EVENTS, EVENT_BY_ID } from '@/lib/mock/events'
import {
  activeHoldExpiresAt,
  authenticateUser,
  cancelBooking as cancelStoredBooking,
  confirmBooking as confirmStoredBooking,
  createPendingBooking,
  getBookingForUser,
  getEventSeats,
  getPreferences,
  getStore,
  listBookingsForUser,
  registerUser,
  updatePreferences,
} from '@/lib/mock/store'
import { seatTotals } from '@/lib/mock/seats'

/**
 * In-process implementation of every service contract, backed by the mock store.
 *
 * Used by Server Components (zero network hop) and by the `/api/*` Route
 * Handlers that stand in for the Node/Express backend. Delete this file once the
 * real backend is deployed — nothing above this layer changes.
 */

/** Mirrors the latency of a real backend so loading states are exercised. */
function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function toSummary(event: Event): EventSummary {
  const totals = seatTotals(getEventSeats(getStore(), event.id))
  const { venue, ...summary } = event
  return {
    ...summary,
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      locality: venue.locality,
      address: venue.address,
    },
    availableSeats: totals.available,
    totalSeats: totals.total,
    soldPercentage: totals.total > 0 ? Math.round((totals.booked / totals.total) * 100) : 0,
    isSellingFast: totals.total > 0 && totals.available / totals.total < 0.15,
  }
}

function createEventServiceMock(): EventService {
  return {
    async list(filters: EventFilters = {}, options?: RequestOptions): Promise<Paginated<EventSummary>> {
      await simulateLatency()
      void options
      const summaries = EVENTS.filter((event) => event.status !== 'DRAFT').map(toSummary)
      const filtered = applyEventFilters(summaries, filters)
      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        pageSize: filtered.length,
        hasMore: false,
      }
    },

    async featured(limit = 4): Promise<EventSummary[]> {
      await simulateLatency()
      const summaries = EVENTS.filter((event) => event.status !== 'DRAFT').map(toSummary)
      return applyEventFilters(summaries, { sort: 'POPULARITY' })
        .filter((event) => new Date(event.startTime).getTime() > Date.now())
        .slice(0, limit)
    },

    async getById(eventId: string): Promise<Event | null> {
      await simulateLatency()
      return EVENT_BY_ID.get(eventId) ?? null
    },

    async related(eventId: string, limit = 3): Promise<EventSummary[]> {
      await simulateLatency()
      const current = EVENT_BY_ID.get(eventId)
      if (!current) return []
      return EVENTS.filter(
        (event) => event.id !== eventId && event.status !== 'DRAFT',
      )
        .map(toSummary)
        .sort((a, b) => {
          const aSame = a.category === current.category ? 1 : 0
          const bSame = b.category === current.category ? 1 : 0
          if (aSame !== bSame) return bSame - aSame
          return a.startTime.localeCompare(b.startTime)
        })
        .slice(0, limit)
    },
  }
}

function createSeatServiceMock(): SeatService {
  return {
    async getSnapshot(eventId: string): Promise<SeatAvailabilitySnapshot | null> {
      await simulateLatency()
      const event = EVENT_BY_ID.get(eventId)
      if (!event) return null
      const store = getStore()
      const userId = await getSessionUserId()
      const seats = getEventSeats(store, eventId).map((seat) => {
        const lock = store.locksBySeat.get(`lock:event:${eventId}:seat:${seat.id}`)
        if (lock && lock.userId === userId) {
          return { ...seat, lockedByCurrentUser: true }
        }
        return seat
      })

      return {
        eventId,
        eventTitle: event.title,
        seats,
        totals: seatTotals(seats),
        holdExpiresAt: activeHoldExpiresAt(store, userId),
        serverTime: Date.now(),
      }
    },
  }
}

function createBookingServiceMock(): BookingService {
  return {
    async list(): Promise<BookingListItem[]> {
      await simulateLatency()
      const userId = await getSessionUserId()
      return listBookingsForUser(getStore(), userId).map((booking) => toListItem(booking))
    },

    async getById(bookingId: string): Promise<Booking | null> {
      await simulateLatency()
      const userId = await getSessionUserId()
      try {
        return getBookingForUser(getStore(), userId, bookingId)
      } catch {
        return null
      }
    },

    async create(input: CreateBookingInput): Promise<CreateBookingResult> {
      const userId = await getSessionUserId()
      const store = getStore()
      const booking = createPendingBooking(store, {
        userId,
        eventId: input.eventId,
        seatIds: input.seatIds,
        idempotencyKey: input.idempotencyKey,
      })
      const ttlSeconds = booking.expiresAt
        ? Math.max(0, Math.round((new Date(booking.expiresAt).getTime() - Date.now()) / 1000))
        : 0
      return { booking, ttlSeconds }
    },

    async confirm(bookingId: string, input: ConfirmBookingInput): Promise<Booking> {
      const userId = await getSessionUserId()
      const { booking } = confirmStoredBooking(getStore(), userId, bookingId, input)
      return booking
    },

    async cancel(bookingId: string): Promise<Booking> {
      const userId = await getSessionUserId()
      return cancelStoredBooking(getStore(), userId, bookingId)
    },

    async activeHold() {
      const store = getStore()
      const userId = await getSessionUserId()
      const expiresAt = activeHoldExpiresAt(store, userId)
      if (expiresAt === null) return null
      const pending = listBookingsForUser(store, userId).find(
        (booking) => booking.status === 'PENDING' && booking.expiresAt,
      )
      if (!pending) return null
      return { bookingId: pending.id, expiresAt: pending.expiresAt as string }
    },
  }
}

function createUserServiceMock(): UserService {
  return {
    async me(): Promise<UserProfile | null> {
      await simulateLatency()
      const store = getStore()
      const userId = await getSessionUserId()
      const user = store.users.get(userId)
      if (!user) return null

      const bookings = listBookingsForUser(store, userId)
      const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED')
      const now = Date.now()

      return {
        ...user,
        stats: {
          totalBookings: bookings.length,
          upcomingBookings: confirmed.filter(
            (booking) => new Date(booking.eventStartTime).getTime() > now,
          ).length,
          seatsAttended: confirmed
            .filter((booking) => new Date(booking.eventStartTime).getTime() < now)
            .reduce((sum, booking) => sum + booking.items.length, 0),
          totalSpent: confirmed.reduce((sum, booking) => sum + booking.pricing.total, 0),
        },
        preferences: getPreferences(store, userId),
      }
    },

    async updatePreferences(patch: Partial<BookingPreferences>): Promise<BookingPreferences> {
      const userId = await getSessionUserId()
      return updatePreferences(getStore(), userId, patch)
    },

    async login(input: LoginInput): Promise<User> {
      const user = authenticateUser(getStore(), input.email, input.password)
      const { createSession } = await import('@/lib/auth/session')
      // An absent `remember` means a session that ends with the browser session.
      await createSession(user.id, input.remember ?? false)
      return user
    },

    async register(input: RegisterInput): Promise<User> {
      const store = getStore()
      const existing = [...store.users.values()].find(
        (candidate) => candidate.email === input.email.toLowerCase(),
      )
      if (existing) throw new ApiError('CONFLICT', 'An account with that email already exists.', 409)

      const user = registerUser(store, {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
      })
      const { createSession } = await import('@/lib/auth/session')
      await createSession(user.id, true)
      return user
    },

    async logout(): Promise<void> {
      const { destroySession } = await import('@/lib/auth/session')
      await destroySession()
    },
  }
}

function createAdminServiceMock(): AdminService {
  return {
    async dashboard(): Promise<AdminDashboardData> {
      await simulateLatency()
      return buildMockAdminDashboard(getStore())
    },
  }
}

export function createMockServices(): Services {
  return {
    events: createEventServiceMock(),
    seats: createSeatServiceMock(),
    bookings: createBookingServiceMock(),
    users: createUserServiceMock(),
    admin: createAdminServiceMock(),
  }
}
