import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { APP_NAME, APP_TAGLINE, SITE_KEYWORDS } from '@/lib/constants'
import { getSiteUrl } from '@/lib/env'
import { Providers } from '@/components/providers'
import { getCurrentUser } from '@/lib/auth/session'
import './globals.css'

const siteUrl = getSiteUrl()

/**
 * Document-level metadata.
 *
 * A single canonical origin is declared here and reused by `alternates` and the
 * Open Graph block, which keeps the SEO surface consistent across every route
 * that does not need its own override.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Pick your exact seat, see availability update in real time, and check out in under a minute. Every seat held safely for you while you pay.',
  applicationName: APP_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: 'Ticket Flow' }],
  creator: 'Ticket Flow',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    url: siteUrl,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      'Real-time seat selection with concurrency-safe holds. Concerts, sports, theatre and conferences across India.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: 'Real-time seat selection with concurrency-safe holds.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'entertainment',
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

/**
 * Organisation-level structured data.
 *
 * Injected once, here, rather than per page: it describes the product itself,
 * while `EventDetailPage` adds `Event` nodes for individual shows.
 */
const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: APP_NAME,
  url: siteUrl,
  description: APP_TAGLINE,
  logo: `${siteUrl}/icon.svg`,
  sameAs: [],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Resolved on the server so the header renders the signed-in identity on the
  // very first paint — no client round-trip, no flash of a "Sign in" button.
  const user = await getCurrentUser()

  return (
    <html
      lang="en-IN"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="tf-bg min-h-dvh bg-void font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-sm focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-void"
        >
          Skip to content
        </a>

        <Providers initialUser={user}>
          <div className="relative flex min-h-dvh flex-col">
            {children}
            <script
              type="application/ld+json"
              // Structured data is static, author-controlled JSON — never user input.
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }}
            />
          </div>
        </Providers>
      </body>
    </html>
  )
}
