import { CheckIcon, LockIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { seatDescription } from '@/lib/seats/layout'
import { MAX_SEATS_PER_BOOKING, SEAT_HOLD_TTL_SECONDS } from '@/lib/constants'
import type { Seat } from '@/types/seat'
import { cn } from '@/lib/utils'

/**
 * Sticky selection bar.
 *
 * The customer's commitment point: what they picked, what it costs, and the one
 * button that takes a real hold. On mobile it docks to the bottom of the
 * viewport (`pb-[env(safe-area-inset-bottom)]`) because that is where the thumb
 * already is, and the map scrolls beneath it.
 */
export function SelectionSummary({
  selectedSeats,
  subtotal,
  onRemove,
  onClear,
  onProceed,
  pending,
  disabled,
}: {
  selectedSeats: Seat[]
  subtotal: number
  onRemove: (seatId: string) => void
  onClear: () => void
  onProceed: () => void
  pending: boolean
  disabled: boolean
}) {
  const count = selectedSeats.length
  const remaining = MAX_SEATS_PER_BOOKING - count

  return (
    <div className="border-t border-white/10 bg-carbon-2/95 backdrop-blur-xl">
      {/* Seat chips — the fastest way to confirm or undo a choice */}
      {count > 0 && (
        <div className="border-b border-white/8 px-4 py-3">
          <ul className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <li key={seat.id}>
                <button
                  type="button"
                  onClick={() => onRemove(seat.id)}
                  className={cn(
                    'group inline-flex items-center gap-2 rounded-sm border border-gold-400/35 bg-gold-400/10 px-2.5 py-1.5 text-xs text-gold-100',
                    'transition-colors hover:border-signal-alert/50 hover:bg-signal-alert/10 hover:text-signal-alert',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80',
                  )}
                >
                  <CheckIcon className="size-3 shrink-0" aria-hidden />
                  <span className="font-mono tracking-wide">{seatDescription(seat)}</span>
                  <span className="text-gold-300/80">{formatCurrency(seat.price)}</span>
                  <XIcon className="size-3 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
                  <span className="sr-only">Remove this seat</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {count === 0 ? (
            <p className="text-sm text-ink-mute">
              Select up to {MAX_SEATS_PER_BOOKING} seats from the plan to continue.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <p className="text-sm text-ink">
                <span className="font-medium tabular-nums">{count}</span>{' '}
                {count === 1 ? 'seat' : 'seats'} selected
              </p>
              <p className="font-mono text-sm tabular-nums text-gold-200">
                {formatCurrency(subtotal)}
              </p>
              <Badge variant="outline" className="hidden sm:inline-flex">
                <LockIcon aria-hidden />
                Held {Math.round(SEAT_HOLD_TTL_SECONDS / 60)} min
              </Badge>
            </div>
          )}

          {count > 0 && remaining > 0 && (
            <p className="mt-1 text-xs text-ink-faint">
              You can add {remaining} more {remaining === 1 ? 'seat' : 'seats'}.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} disabled={pending}>
              <MinusIcon aria-hidden />
              Clear
            </Button>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={onProceed}
            disabled={count === 0 || disabled}
            className="flex-1 sm:flex-none"
          >
            {pending ? (
              <>
                <PlusIcon className="size-4 animate-pulse" aria-hidden />
                Holding seats…
              </>
            ) : (
              <>
                <LockIcon aria-hidden />
                Hold &amp; continue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
