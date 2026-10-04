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

/**
 * Service contracts consumed by the UI.
 *
 * Components, hooks and Server Components only ever see these interfaces. The
 * implementation is chosen at runtime by `getServerServices()` /`getClientServices()`
 * so the backend can replace the mock layer without touching a single view.
 */
export interface EventService {
  /** FR-EVENT-03 — public catalogue with search, filtering and sorting. */
  list(filters?: EventFilters, options?: RequestOptions): Promise<Paginated<EventSummary>>
  /** Landing-page strip. */
  featured(limit?: number, options?: RequestOptions): Promise<EventSummary[]>
  /** FR-EVENT-04 — full detail including the pricing matrix. */
  getById(eventId: string, options?: RequestOptions): Promise<Event | null>
  related(eventId: string, limit?: number, options?: RequestOptions): Promise<EventSummary[]>
}

export interface SeatService {
  /** FR-SEAT-03 — current availability map for an event. */
  getSnapshot(eventId: string, options?: RequestOptions): Promise<SeatAvailabilitySnapshot | null>
}

export interface BookingService {
  /** FR-AUTH-05 — the signed-in customer's history. */
  list(options?: RequestOptions): Promise<BookingListItem[]>
  getById(bookingId: string, options?: RequestOptions): Promise<Booking | null>
  /** FR-BOOK-02 — acquires the distributed hold and returns the checkout timer. */
  create(input: CreateBookingInput, options?: RequestOptions): Promise<CreateBookingResult>
  /** FR-BOOK-04 — settles payment in test mode and commits the transaction. */
  confirm(bookingId: string, input: ConfirmBookingInput, options?: RequestOptions): Promise<Booking>
  /** FR-BOOK-06 — cancels and releases inventory. */
  cancel(bookingId: string, options?: RequestOptions): Promise<Booking>
  /** The customer's live hold, used to resume an interrupted checkout. */
  activeHold(options?: RequestOptions): Promise<{ bookingId: string; expiresAt: string } | null>
}

export interface UserService {
  me(options?: RequestOptions): Promise<UserProfile | null>
  updatePreferences(
    patch: Partial<BookingPreferences>,
    options?: RequestOptions,
  ): Promise<BookingPreferences>
  /** FR-AUTH-02 */
  login(input: LoginInput, options?: RequestOptions): Promise<User>
  /** FR-AUTH-01 */
  register(input: RegisterInput, options?: RequestOptions): Promise<User>
  /** Clears the session. Maps to a refresh-token revoke on the real backend. */
  logout(options?: RequestOptions): Promise<void>
}

export interface AdminService {
  /** FR-ADMIN-01 / FR-ADMIN-03 */
  dashboard(options?: RequestOptions): Promise<AdminDashboardData>
}

export interface Services {
  events: EventService
  seats: SeatService
  bookings: BookingService
  users: UserService
  admin: AdminService
}