'use client'

import { QueryClient } from '@tanstack/react-query'

/**
 * Shared server-state cache.
 *
 * Defaults are tuned for a ticketing catalogue rather than a generic dashboard:
 *
 *   • `staleTime` 30s — seat and event data changes on the order of seconds, so
 *     refetching on every focus would burn requests and make prices flicker;
 *   • seat data is never cached beyond `staleTime` and is additionally
 *     invalidated by the real-time layer, so a stale seat can never outlive its
 *     version counter;
 *   * `retry` skips 4xx — a 409 conflict or a 401 is an answer, not a hiccup,
 *     and retrying it would only delay the error the user needs to see.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number } | undefined)?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

/** Query-key factory — one place to change if the API surface is renamed. */
export const queryKeys = {
  events: (filters?: unknown) => ['events', filters ?? {}] as const,
  event: (eventId: string) => ['event', eventId] as const,
  seats: (eventId: string) => ['seats', eventId] as const,
  bookings: () => ['bookings'] as const,
  booking: (bookingId: string) => ['booking', bookingId] as const,
  activeHold: (eventId: string) => ['active-hold', eventId] as const,
  me: () => ['me'] as const,
  adminDashboard: () => ['admin', 'dashboard'] as const,
  eventSummary: (eventId: string) => ['event-summary', eventId] as const,
} as const