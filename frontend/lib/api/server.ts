import 'server-only'
import { getApiUrl } from '@/lib/env'
import { createHttpServices } from './index'
import { createMockServices } from './mock-services'
import type { Services } from './contracts'

/**
 * Server-side entry point.
 *
 * With no backend configured it resolves to the in-process mock services, which
 * means Server Components read the store directly — no fetch, no loading state,
 * no waterfall. Set `NEXT_PUBLIC_API_URL` and the same pages transparently read
 * from the Express backend instead.
 */

let cached: Services | null = null

export function getServerServices(): Services {
  if (cached) return cached
  cached = getApiUrl() ? createHttpServices(getApiUrl() as string) : createMockServices()
  return cached
}
