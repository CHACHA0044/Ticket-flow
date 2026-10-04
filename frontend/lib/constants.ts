/**
 * Application-wide constants.
 * Anything that encodes a business rule from /docs (SRS §3.4) lives here so it
 * can be relocated to backend configuration later without touching components.
 */

export const APP_NAME = 'Ticket Flow'
export const APP_TAGLINE = 'Scalable Real-Time Event Ticket Booking System'

/** FR-BOOK-01 — maximum seats permitted in a single transaction. */
export const MAX_SEATS_PER_BOOKING = 6

/** FR-BOOK-02 — seat hold window (seconds). SRS specifies 5–10 minutes. */
export const SEAT_HOLD_TTL_SECONDS = 600

/** Concurrency guard window enforced client-side to mirror FR-CONC-03. */
export const SEAT_LOCK_SETTLE_MS = 220

/** Platform fee model (test-mode). */
export const PLATFORM_FEE_RATE = 0.06
export const CONVENIENCE_FEE_PER_TICKET = 18
export const GST_RATE = 0.18

/** Currency used across the demo dataset (ISO 4217). */
export const CURRENCY = 'INR'
export const CURRENCY_LOCALE = 'en-IN'

export const ROUTES = {
  home: '/',
  events: '/events',
  howItWorks: '/how-it-works',
  checkout: '/checkout',
  bookings: '/bookings',
  profile: '/profile',
  login: '/login',
  register: '/register',
  admin: '/admin',
} as const

/** Primary customer navigation. Kept intentionally short. */
export const PRIMARY_NAV = [
  { href: ROUTES.events, label: 'Events' },
  { href: ROUTES.howItWorks, label: 'How It Works' },
  { href: ROUTES.bookings, label: 'My Bookings' },
  { href: ROUTES.profile, label: 'Profile' },
] as const

/** Routes that must never be indexed by crawlers (authenticated surfaces). */
export const PRIVATE_ROUTES = [ROUTES.bookings, ROUTES.profile, ROUTES.admin, ROUTES.checkout]

export const SITE_KEYWORDS = [
  'Ticket Flow',
  'event ticket booking',
  'real-time seat booking',
  'concurrency-safe ticketing',
  'concert tickets',
  'seat map',
] as const