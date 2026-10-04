/**
 * Event & venue domain model.
 * Mirrors the `events` / `venues` collections in /docs/database/database-design.md.
 */

export type EventCategory = 'CONCERT' | 'SPORTS' | 'CONFERENCE' | 'THEATRE' | 'COMEDY'

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  'CONCERT',
  'SPORTS',
  'CONFERENCE',
  'THEATRE',
  'COMEDY',
] as const

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'CANCELLED'

/** Human-facing labels for the enum values defined by the SRS. */
export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  CONCERT: 'Concert',
  SPORTS: 'Sports',
  CONFERENCE: 'Conference',
  THEATRE: 'Theatre',
  COMEDY: 'Comedy',
}

export interface PricingTier {
  /** `tierName` in the database schema. */
  tierName: string
  price: number
  currency: string
  /** Short qualifier rendered in tier cards, e.g. "Front row, lounge access". */
  perk?: string
  /** Ordering hint — lower sorts first. */
  sortOrder: number
}

export interface VenueSection {
  /** Section identifier, e.g. `VIP`, `A`, `J`. */
  code: string
  name: string
  /** Rows belonging to the section, in render order (front → back). */
  rows: string[]
  /** Seats per row (constant within a section keeps the grid aligned). */
  seatsPerRow: number
  /** Tier applied to every seat in this section. */
  tierName: string
  price: number
  /** Accessible (wheelchair) seating positions. */
  accessibleSeats?: AccessiblePosition[]
}

export interface AccessiblePosition {
  row: string
  seatNumber: number
}

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  /** IANA-less label rendered on cards, e.g. "Bandra West, Mumbai". */
  locality: string
  capacity: number
  sections: VenueSection[]
  createdAt: string
}

export interface EventSummary {
  id: string
  title: string
  category: EventCategory
  status: EventStatus
  startTime: string
  endTime: string
  venue: Pick<Venue, 'id' | 'name' | 'city' | 'locality' | 'address'>
  /** Cached for list views — avoids shipping the full pricing matrix. */
  minPrice: number
  maxPrice: number
  currency: string
  totalSeats: number
  availableSeats: number
  /** 0–100 */
  soldPercentage: number
  /** Marks events whose inventory is close to exhausted. */
  isSellingFast: boolean
  /** Short editorial line shown under the title. */
  tagline: string
  /** Deterministic artwork descriptor consumed by <EventPoster>. */
  poster: PosterSpec
}

export interface Event extends Omit<EventSummary, 'venue'> {
  description: string
  /** Long-form detail paragraphs for the event page. */
  highlights: string[]
  venue: Venue
  pricingTiers: PricingTier[]
  salesOpenAt: string
  salesCloseAt: string
  /** High-demand events are gated by the virtual waiting room (Semester VIII). */
  requiresWaitingRoom: boolean
  createdAt: string
}

/**
 * Generated artwork descriptor. Event imagery is synthesised from this spec
 * (CSS gradients + SVG geometry) so the frontend ships zero binary assets and
 * stays fast on low-end devices.
 */
export interface PosterSpec {
  /** 0–360 hue anchor for the metallic gradient ramp. */
  hue: number
  /** Secondary accent hue used for the light sweep. */
  accentHue: number
  /** Geometry variant rendered behind the wordmark. */
  motif: 'arc' | 'chevron' | 'grid' | 'orbit' | 'wave'
  /** Short two/three character code shown on the poster. */
  code: string
}

/** Query contract for the public catalog (FR-EVENT-03). */
export interface EventFilters {
  search?: string
  category?: EventCategory | 'ALL'
  city?: string | 'ALL'
  /** ISO date (yyyy-mm-dd) lower bound. */
  dateFrom?: string
  /** ISO date (yyyy-mm-dd) upper bound. */
  dateTo?: string
  priceMax?: number
  availability?: 'ALL' | 'AVAILABLE' | 'SELLING_FAST'
  sort?: EventSortKey
}

export type EventSortKey = 'DATE_ASC' | 'DATE_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULARITY'

export const EVENT_SORT_OPTIONS: readonly { value: EventSortKey; label: string }[] = [
  { value: 'DATE_ASC', label: 'Soonest first' },
  { value: 'POPULARITY', label: 'Most popular' },
  { value: 'PRICE_ASC', label: 'Price: low to high' },
  { value: 'PRICE_DESC', label: 'Price: high to low' },
  { value: 'DATE_DESC', label: 'Latest first' },
] as const