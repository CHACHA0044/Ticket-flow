'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { SeatMap, type SeatZoom } from '@/components/seats/seat-map'
import { SeatLegend } from '@/components/seats/seat-legend'
import { SeatMapToolbar } from '@/components/seats/seat-map-toolbar'
import { SelectionSummary } from '@/components/seats/selection-summary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSeatAvailability } from '@/hooks/use-seat-availability'
import { calculateSeatSubtotal } from '@/lib/booking/pricing'
import { MAX_SEATS_PER_BOOKING, ROUTES } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { Event } from '@/types/event'
import type { SeatAvailabilitySnapshot } from '@/types/seat'
import { ApiError } from '@/types/api'

/**
 * Seat selection screen.
 *
 * Owns exactly one piece of authoritative client state — the seat map — and
 * delegates the hold to the booking service. Everything else on this screen is
 * derived. The initial snapshot comes from the server component, so the map is
 * fully painted before hydration and the page never flashes an empty venue.
 */
export function SeatSelectionScreen({
  event,
  initialSnapshot,
}: {
  event: Event
  initialSnapshot: SeatAvailabilitySnapshot
}) {
  const router = useRouter()
  const [zoom, setZoom] = React.useState<SeatZoom>('default')
  const [pending, setPending] = React.useState(false)

  const seats = useSeatAvailability({
    eventId: event.id,
    venue: event.venue,
    initial: initialSnapshot,
    maxSeats: MAX_SEATS_PER_BOOKING,
  })

  const subtotal = React.useMemo(
    () => calculateSeatSubtotal(seats.selectedSeats),
    [seats.selectedSeats],
  )

  const proceed = async () => {
    if (seats.selectedIds.length === 0) return
    setPending(true)

    try {
      const { getClientServices } = await import('@/lib/api')
      const result = await getClientServices().bookings.create({
        eventId: event.id,
        seatIds: seats.selectedIds,
        // Stable per attempt so a double-submit cannot create two holds.
        idempotencyKey: `${event.id}:${seats.selectedIds.join(',')}`,
      })

      seats.clearSelection()
      router.push(`${ROUTES.checkout}?booking=${result.booking.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.isSeatConflict) {
        // FR-CONC-01 — someone beat us to it. Say so plainly and let the user
        // re-pick from a map that is already corrected by the real-time feed.
        toast.error('Those seats are no longer available', {
          description: error.message,
        })
        const { getClientServices } = await import('@/lib/api')
        const refreshed = await getClientServices().seats.getSnapshot(event.id)
        if (refreshed) router.refresh()
      } else {
        toast.error('Could not hold those seats', {
          description:
            error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        })
      }
    } finally {
      setPending(false)
    }
  }

  const soldOut = seats.totals.available === 0
  const showResume = initialSnapshot.holdExpiresAt !== null && seats.selectedIds.length === 0

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {/* Map */}
      <div className="flex min-w-0 flex-col gap-4">
        <SeatMapToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          liveStatus={seats.realtimeStatus}
          lastEventAt={seats.lastEventAt}
          transport={seats.transport}
        />

        <SeatLegend />

        {soldOut && (
          <Alert variant="warning">
            <AlertTitle>Every seat in this venue is gone</AlertTitle>
            <AlertDescription>
              This event is fully booked. Join the waitlist from the event page, or
              browse something else.
            </AlertDescription>
          </Alert>
        )}

        {showResume && (
          <Alert variant="gold">
            <AlertTitle>You have seats on hold</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                An earlier checkout is still counting down. Finish it, or let the hold
                lapse and the seats return to sale.
              </span>
              <Button asChild size="sm" variant="primary" className="shrink-0">
                <Link href={ROUTES.checkout}>Resume checkout</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <SeatMap
          layout={seats.layout}
          isSelected={seats.isSelected}
          onToggle={(seat) =>
            seats.isSelected(seat.id) ? seats.deselectSeat(seat.id) : seats.selectSeat(seat)
          }
          recentlyUpdated={seats.recentlyUpdated}
          zoom={zoom}
        />

        {/* Availability breakdown — the honest state of the room */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-5 sm:pt-6">
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { label: 'Available', value: seats.totals.available, tone: 'text-signal-live' },
                { label: 'Held', value: seats.totals.locked, tone: 'text-signal-hold' },
                { label: 'Sold', value: seats.totals.booked, tone: 'text-ink-mute' },
                { label: 'Total', value: seats.totals.total, tone: 'text-ink' },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                    {item.label}
                  </dt>
                  <dd className={`text-sm font-medium tabular-nums ${item.tone}`}>
                    {formatNumber(item.value)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="flex items-center gap-1.5 text-xs text-ink-faint">
              <InfoIcon className="size-3.5" aria-hidden />
              Arrow keys move between seats once the map has focus.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar summary — desktop and tablet landscape. The fixed bar below
          is hidden at `lg` and up, so exactly one action surface exists per
          viewport and no control is ever duplicated in the accessibility tree. */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <h2 className="text-sm font-medium text-ink">Your selection</h2>

            {seats.selectedSeats.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-mute">
                Pick seats from the plan. You can choose up to {MAX_SEATS_PER_BOOKING} at a
                time, and they are held the moment you continue.
              </p>
            ) : (
              <>
                <ul className="mt-4 flex flex-col gap-2">
                  {seats.selectedSeats.map((seat) => (
                    <li key={seat.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-ink-soft">
                        {seat.section} · Row {seat.row} · {seat.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => seats.deselectSeat(seat.id)}
                        className="shrink-0 rounded-xs text-ink-faint transition-colors hover:text-signal-alert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80"
                      >
                        Remove
                        <span className="sr-only">
                          {' '}
                          seat {seat.section} row {seat.row} number {seat.number}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-baseline justify-between border-t border-white/8 pt-4">
                  <span className="text-xs text-ink-mute">Seat subtotal</span>
                  <span className="font-mono text-base tabular-nums text-gold-200">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </>
            )}

            <Button
              variant="primary"
              block
              size="lg"
              className="mt-5"
              disabled={seats.selectedSeats.length === 0}
              onClick={() => void proceed()}
            >
              {pending ? 'Holding seats…' : 'Hold & continue'}
            </Button>

            {seats.selectedSeats.length > 0 && (
              <Button
                variant="ghost"
                block
                size="sm"
                className="mt-2"
                onClick={seats.clearSelection}
                disabled={pending}
              >
                Clear selection
              </Button>
            )}

            <Button asChild variant="outline" block size="sm" className="mt-4">
              <Link href={ROUTES.events}>Browse other events</Link>
            </Button>
          </CardContent>
        </Card>

        {seats.selectedSeats.length > 0 && (
          <Alert variant="default" className="mt-4">
            <AlertDescription className="flex items-start gap-2 text-xs">
              <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-signal-hold" aria-hidden />
              Seats are only locked once you continue to checkout — they stay highlighted
              in your browser until then.
            </AlertDescription>
          </Alert>
        )}
      </aside>

      {/* Mobile / tablet action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <SelectionSummary
          selectedSeats={seats.selectedSeats}
          subtotal={subtotal}
          onRemove={seats.deselectSeat}
          onClear={seats.clearSelection}
          onProceed={() => void proceed()}
          pending={pending}
          disabled={soldOut}
        />
      </div>
    </div>
  )
}
