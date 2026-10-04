import type { HttpClient } from './client'
import type { SeatAvailabilitySnapshot } from '@/types/seat'
import type { RequestOptions } from '@/types/api'
import type { SeatService } from './contracts'

/** HTTP implementation of the live availability endpoint (FR-SEAT-03). */
export function createSeatService(client: HttpClient): SeatService {
  return {
    async getSnapshot(eventId: string, options?: RequestOptions) {
      const result = await client.request<{ snapshot: SeatAvailabilitySnapshot | null }>(
        `/events/${eventId}/seats`,
        options,
      )
      return result.snapshot
    },
  }
}