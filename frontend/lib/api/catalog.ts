import type { EventFilters, EventSummary } from '@/types/event'
import type { EventCategory } from '@/types/event'
import { EVENT_CATEGORY_LABEL } from '@/types/event'

/**
 * Event catalogue query logic.
 *
 * Lives outside the transport layer so the mock store and the real REST API can
 * share the exact same filtering, sorting and summary semantics.
 */

export function toLocalDateKey(iso: string): string {
  const date = new Date(iso)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function matchesFilters(event: EventSummary, filters: EventFilters, now = Date.now()): boolean {
  const search = filters.search?.trim().toLowerCase()
  if (search) {
    const haystack = [
      event.title,
      event.tagline,
      event.venue.name,
      event.venue.city,
      event.venue.locality,
      EVENT_CATEGORY_LABEL[event.category as EventCategory],
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }

  if (filters.category && filters.category !== 'ALL' && event.category !== filters.category) {
    return false
  }

  if (filters.city && filters.city !== 'ALL' && event.venue.city !== filters.city) return false

  const dateKey = toLocalDateKey(event.startTime)
  if (filters.dateFrom && dateKey < filters.dateFrom) return false
  if (filters.dateTo && dateKey > filters.dateTo) return false

  if (filters.priceMax && event.minPrice > filters.priceMax) return false

  if (filters.availability === 'AVAILABLE' && event.availableSeats <= 0) return false
  if (filters.availability === 'SELLING_FAST' && !event.isSellingFast) return false

  return new Date(event.startTime).getTime() >= now - 3_600_000
}

export function sortEvents(events: EventSummary[], sort: EventFilters['sort']): EventSummary[] {
  const copy = [...events]
  switch (sort) {
    case 'PRICE_ASC':
      return copy.sort((a, b) => a.minPrice - b.minPrice)
    case 'PRICE_DESC':
      return copy.sort((a, b) => b.minPrice - a.minPrice)
    case 'POPULARITY':
      return copy.sort((a, b) => b.soldPercentage - a.soldPercentage)
    case 'DATE_DESC':
      return copy.sort((a, b) => b.startTime.localeCompare(a.startTime))
    case 'DATE_ASC':
    default:
      return copy.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
}

export function applyEventFilters(
  events: EventSummary[],
  filters: EventFilters,
  now = Date.now(),
): EventSummary[] {
  return sortEvents(
    events.filter((event) => matchesFilters(event, filters, now)),
    filters.sort ?? 'DATE_ASC',
  )
}