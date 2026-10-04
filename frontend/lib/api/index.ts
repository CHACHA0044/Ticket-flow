import { createHttpClient, type HttpRequest } from './client'
import { createAdminService } from './admin'
import { createBookingService } from './bookings'
import { createEventService } from './events'
import { createSeatService } from './seats'
import { createUserService } from './users'
import { getApiUrl } from '@/lib/env'
import type { Services } from './contracts'

export { ApiError } from '@/types/api'
export type { Services } from './contracts'
export type { HttpRequest }

/** Builds the full service graph on top of one HTTP transport. */
export function createHttpServices(baseUrl: string): Services {
  const client = createHttpClient(baseUrl)
  return {
    events: createEventService(client),
    seats: createSeatService(client),
    bookings: createBookingService(client),
    users: createUserService(client),
    admin: createAdminService(client),
  }
}

let cached: { baseUrl: string; services: Services } | null = null

/**
 * Client-side entry point.
 *
 * Without `NEXT_PUBLIC_API_URL` the calls are routed to this app's own
 * `/api/*` Route Handlers, which run the mock services in-process. Point the
 * variable at the Express backend and the exact same UI code talks to production.
 */
export function getClientServices(): Services {
  const baseUrl = getApiUrl() ?? '/api'
  if (cached?.baseUrl === baseUrl) return cached.services
  const services = createHttpServices(baseUrl)
  cached = { baseUrl, services }
  return services
}