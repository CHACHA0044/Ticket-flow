import type { HttpClient } from './client'
import type {
  Booking,
  BookingListItem,
  ConfirmBookingInput,
  CreateBookingInput,
  CreateBookingResult,
} from '@/types/booking'
import type { RequestOptions } from '@/types/api'
import type { BookingService } from './contracts'

/** HTTP implementation of the booking endpoints (FR-BOOK-01 … FR-BOOK-06). */
export function createBookingService(client: HttpClient): BookingService {
  return {
    async list(options?: RequestOptions) {
      const result = await client.request<{ bookings: BookingListItem[] }>('/bookings', options)
      return result.bookings
    },

    async getById(bookingId: string, options?: RequestOptions) {
      const result = await client.request<{ booking: Booking | null }>(`/bookings/${bookingId}`, options)
      return result.booking
    },

    async create(input: CreateBookingInput, options?: RequestOptions) {
      return client.request<CreateBookingResult>('/bookings', {
        method: 'POST',
        body: input,
        ...options,
      })
    },

    async confirm(bookingId: string, input: ConfirmBookingInput, options?: RequestOptions) {
      return client.request<Booking>(`/bookings/${bookingId}/confirm`, {
        method: 'POST',
        body: input,
        ...options,
      })
    },

    async cancel(bookingId: string, options?: RequestOptions) {
      return client.request<Booking>(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: {},
        ...options,
      })
    },

    async activeHold(options?: RequestOptions) {
      const result = await client.request<{
        hold: { bookingId: string; expiresAt: string } | null
      }>('/bookings/active-hold', options)
      return result.hold
    },
  }
}