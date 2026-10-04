'use client'

import * as React from 'react'
import Link from 'next/link'
import { RotateCwIcon, ServerCrashIcon, TriangleAlertIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

/**
 * Root error boundary.
 *
 * The digest is surfaced because it is the only handle a customer can quote when
 * reporting a failure — it correlates with the server log line. The underlying
 * message is deliberately never shown: it can carry query text, identifiers or
 * upstream provider details.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Surfaces in the browser console and, in production, in the Vercel log.
    console.error('Unhandled route error', error)
  }, [error])

  const notFound = 'NEXT_HTTP_ERROR_FALLBACK;404' in error || error.message.includes('404')

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
        <span className="grid size-12 place-items-center rounded-md border border-white/10 bg-carbon-2 text-ink-faint">
          {notFound ? (
            <TriangleAlertIcon className="size-5" aria-hidden />
          ) : (
            <ServerCrashIcon className="size-5" aria-hidden />
          )}
        </span>

        <p aria-hidden className="mt-6 font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
          {notFound ? 'Error 404' : 'Something broke'}
        </p>

        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {notFound ? 'That page does not exist' : 'This screen failed to load'}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
          {notFound
            ? 'The link may be out of date, or the event may have been removed.'
            : 'The rest of the site is unaffected. Retrying usually clears it.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!notFound && (
            <Button variant="primary" onClick={reset}>
              <RotateCwIcon aria-hidden />
              Try again
            </Button>
          )}
          <Button asChild variant={notFound ? 'primary' : 'outline'}>
            <Link href={ROUTES.events}>Browse events</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.home}>Go home</Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-2xs text-ink-faint">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </PageShell>
  )
}
