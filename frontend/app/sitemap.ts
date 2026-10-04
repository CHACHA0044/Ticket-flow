import type { MetadataRoute } from 'next'
import { getServerServices } from '@/lib/api/server'
import { getSiteUrl } from '@/lib/env'
import { ROUTES } from '@/lib/constants'

/**
 * Sitemap.
 *
 * Only the public surface is listed. `/bookings`, `/profile`, `/admin` and
 * `/checkout` are authenticated or per-user, so including them would advertise
 * dead links to crawlers — the routes themselves carry `robots: noindex` as a
 * second line of defence.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}${ROUTES.home}`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}${ROUTES.events}`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}${ROUTES.howItWorks}`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  let events: MetadataRoute.Sitemap = []
  try {
    const page = await getServerServices().events.list({ sort: 'DATE_ASC' })
    events = page.items.map((event) => ({
      url: `${baseUrl}${ROUTES.events}/${event.id}`,
      lastModified: event.startTime,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  } catch {
    // A sitemap must never 500 because the catalogue is unavailable; static
    // routes alone are still valid.
  }

  return [...staticRoutes, ...events]
}
