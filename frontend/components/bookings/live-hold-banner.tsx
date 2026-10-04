'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHoldCountdown } from '@/hooks/use-hold-countdown'
import { getClientServices } from '@/lib/api'
import { SEAT_HOLD_TTL_SECONDS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * "You left something at checkout" banner.
 *
 * The hold is not derivable from the booking list alone — it lives behind
 * `activeHold()` on the server, keyed by the session — so the server component
 * fetches it and passes it in as `initialHold`. Seeding it matters: a
 * client-only query would leave the banner invisible until hydration, which is
 * exactly the moment a customer with a live hold is most likely to be watching.
 *
 * The query still runs afterwards so a hold created in another tab surfaces
 * without a reload, and polling is bounded to the hold's remaining life.
 */
export function LiveHoldBanner({
  initialHold,
  className,
}: {
  initialHold: { bookingId: string; expiresAt: string } | null
  className?: string
}) {
  const [dismissed, setDismissed] = React.useState(false)

  const { data: hold } = useQuery({
    queryKey: ['bookings', 'active-hold'],
    queryFn: () => getClientServices().bookings.activeHold(),
    initialData: initialHold,
    staleTime: 5_000,
    // Only poll while a hold plausibly exists; a null hold stops the refetch loop.
    refetchInterval: (query) =>
      query.state.data && new Date(query.state.data.expiresAt).getTime() > Date.now() ? 15_000 : false,
  })

  if (dismissed || !hold) return null

  return (
    <HoldCard
      key={hold.bookingId}
      bookingId={hold.bookingId}
      expiresAt={hold.expiresAt}
      onDismiss={() => setDismissed(true)}
      className={className}
    />
  )
}

function HoldCard({
  bookingId,
  expiresAt,
  onDismiss,
  className,
}: {
  bookingId: string
  expiresAt: string
  onDismiss: () => void
  className?: string
}) {
  const { secondsLeft, expired, label, progress } = useHoldCountdown(expiresAt, SEAT_HOLD_TTL_SECONDS)

  if (expired) return null

  // Under two minutes: escalate the accent, because the seat is about to be released.
  const urgent = secondsLeft <= 120

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-signal-hold/30 bg-signal-hold/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
        urgent && 'border-signal-alert/40 bg-signal-alert/8',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-signal-hold/15 text-signal-hold',
            urgent && 'bg-signal-alert/15 text-signal-alert',
          )}
        >
          <TimerIcon className="size-4" aria-hidden />
        </span>

        <div>
          <p className="text-sm font-medium text-ink">
            You have seats waiting at checkout.{' '}
            <span className="text-ink-mute">
              The hold releases automatically when the timer reaches zero.
            </span>
          </p>

          <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-mute">
            <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
              Time left
            </span>
            {/* Announced politely: a per-second live region would be unusable. */}
            <span
              className={cn(
                'font-mono text-sm tabular-nums',
                urgent ? 'text-signal-alert' : 'text-signal-hold',
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {label}
            </span>
          </p>

          <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
            <div
              className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', urgent ? 'bg-signal-alert' : 'bg-signal-hold')}
              style={{ width: `${Math.max(2, progress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col md:flex-row">
        <Button asChild size="sm" variant="primary">
          <Link href={`/checkout?booking=${bookingId}`}>Finish checkout</Link>
        </Button>
        {/* Local only — deliberately not labelled "release", which would promise an
            inventory write this button does not perform. */}
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
