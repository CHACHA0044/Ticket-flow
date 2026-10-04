'use client'

import * as React from 'react'
import { ClockIcon, TriangleAlertIcon } from 'lucide-react'
import type { HoldCountdown } from '@/hooks/use-hold-countdown'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/**
 * Seat-hold countdown (FR-BOOK-02 / FR-BOOK-03).
 *
 * Announced politely rather than assertively: a ticking timer that interrupts a
 * screen reader every second would make the page unusable. The *expired* state
 * does become an alert, because at that point the transaction is genuinely at
 * risk and the user must act.
 */
export function HoldTimer({
  countdown,
  onExpired,
  className,
}: {
  /** Owned by the caller so one timer drives both the digits and the page state. */
  countdown: HoldCountdown
  onExpired?: () => void
  className?: string
}) {
  const { secondsLeft, expired, label, progress } = countdown

  const urgent = !expired && secondsLeft <= 120

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border px-4 py-3 transition-colors duration-300',
        expired
          ? 'border-signal-alert/45 bg-signal-alert/10'
          : urgent
            ? 'border-signal-hold/45 bg-signal-hold/10'
            : 'border-gold-400/30 bg-gold-400/8',
        className,
      )}
      role={expired ? 'alert' : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-ink-mute">
          {expired ? (
            <TriangleAlertIcon className="size-3.5 text-signal-alert" aria-hidden />
          ) : (
            <ClockIcon className={cn('size-3.5', urgent ? 'text-signal-hold' : 'text-gold-300')} aria-hidden />
          )}
          {expired ? 'Hold expired' : 'Seats held for you'}
        </p>

        <p
          className={cn(
            'font-mono text-lg font-semibold tabular-nums',
            expired ? 'text-signal-alert' : urgent ? 'text-signal-hold' : 'text-gold-200',
          )}
        >
          {expired ? '00:00' : label}
        </p>
      </div>

      <Progress
        value={progress * 100}
        label="Time remaining on seat hold"
        indicatorClassName={cn(
          expired && 'bg-signal-alert/70',
          !expired && urgent && 'bg-signal-hold/80',
        )}
      />

      <p aria-live={expired ? 'assertive' : 'polite'} className="text-xs text-ink-mute">
        {expired
          ? 'These seats have been released back to other buyers. Start a new selection to try again.'
          : urgent
            ? 'Less than two minutes left — finish payment to keep these seats.'
            : 'Complete payment before the timer ends, or the seats return to sale automatically.'}
      </p>

      <ExpiredNotifier expired={expired} onExpired={onExpired} />
    </div>
  )
}

/** Fires `onExpired` exactly once, outside the render pass. */
function ExpiredNotifier({
  expired,
  onExpired,
}: {
  expired: boolean
  onExpired?: () => void
}) {
  const fired = React.useRef(false)

  React.useEffect(() => {
    if (expired && !fired.current) {
      fired.current = true
      onExpired?.()
    }
    if (!expired) fired.current = false
  }, [expired, onExpired])

  return null
}
