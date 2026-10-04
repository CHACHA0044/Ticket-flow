import type { HttpClient } from './client'
import type { EventFilters, Event, EventSummary } from '@/types/event'
import type { Paginated, RequestOptions } from '@/types/api'
import type { EventService } from './contracts'

/** HTTP implementation of the catalogue endpoints (FR-EVENT-03/04). */
export function createEventService(client: HttpClient): EventService {
  return {
    async list(filters: EventFilters = {}, options?: RequestOptions) {
      return client.request<Paginated<EventSummary>>('/events', {
        query: {
          search: filters.search,
          category: filters.category,
          city: filters.city,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          priceMax: filters.priceMax,
          availability: filters.availability,
          sort: filters.sort,
        },
        ...options,
      })
    },

    async featured(limit = 4, options?: RequestOptions) {
      const result = await client.request<Paginated<EventSummary>>('/events', {
        query: { featured: true, limit },
        ...options,
      })
      return result.items
    },

    async getById(eventId: string, options?: RequestOptions) {
      const result = await client.request<{ event: Event | null }>(`/events/${eventId}`, options)
      return result.event
    },

    async related(eventId: string, limit = 3, options?: RequestOptions) {
      const result = await client.request<Paginated<EventSummary>>('/events', {
        query: { relatedTo: eventId, limit },
        ...options,
      })
      return result.items
    },
  }
}