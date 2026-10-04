import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarSearchIcon, SearchIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
  robots: { index: false, follow: true },
}

/**
 * 404 for unknown routes *and* for `notFound()` calls from Server Components.
 *
 * Suggests the catalogue rather than a dead end: most 404s here are expired
 * event links, and the customer's next move is always "find something else".
 */
export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
        <span className="grid size-12 place-items-center rounded-md border border-white/10 bg-carbon-2 text-gold-300">
          <CalendarSearchIcon className="size-5" aria-hidden />
        </span>

        <p aria-hidden className="mt-6 font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
          Error 404
        </p>

        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          We could not find that page
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
          The event may have been removed, or the link may have a typo. Everything
          currently on sale is one click away.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary">
            <Link href={ROUTES.events}>
              <SearchIcon aria-hidden />
              Browse events
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>Go home</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
