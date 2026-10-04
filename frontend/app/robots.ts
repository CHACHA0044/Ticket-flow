import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/env'

/**
 * Robots policy.
 *
 * Disallows the authenticated surfaces and `/api/` explicitly. Crawlers are
 * welcome in the catalogue because event pages are the entire SEO surface of a
 * ticketing product.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/checkout', '/bookings', '/profile', '/admin', '/login', '/register'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
