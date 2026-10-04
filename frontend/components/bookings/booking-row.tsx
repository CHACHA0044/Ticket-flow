import Link from 'next/link'
import { CalendarClockIcon, MapPinIcon, TicketIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BOOKING_STATUS_LABEL, type BookingListItem, type BookingStatus } from '@/types/booking'
import { formatDate, formatPreciseCurrency, formatTime, toDateTimeAttr } from '@/lib/format'

const STATUS_VARIANT: Record<BookingStatus, 'gold' | 'success' | 'danger' | 'warning'> = {
  PENDING: 'gold',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  EXPIRED: 'warning',
}

/**
 * Booking row.
 *
 * Status is expressed three ways at once — text, hue, and an explicit progress
 * bar for PENDING bookings (which have a real countdown attached) — so it never
 * depends on colour alone.
 */
export function BookingRow({ booking }: { booking: BookingListItem }) {
  const pending = booking.status === 'PENDING'

  return (
    <li>
      <article className="group relative rounded-lg border border-white/8 bg-carbon transition-[border-color,transform] duration-200 hover:border-gold-400/30 hover:-translate-y-0.5 motion-reduce:transform-none">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          {/* When */}
          <div className="flex shrink-0 items-center gap-4 lg:w-56">
            <div className="flex w-14 shrink-0 flex-col items-center rounded-md border border-white/10 bg-carbon-2 py-2">
              <span className="font-mono text-2xs uppercase tracking-[0.12em] text-gold-300">
                {formatDate(booking.eventStartTime).split(' ')[1]}
              </span>
              <span className="text-lg font-semibold leading-tight tabular-nums text-ink">
                {new Date(booking.eventStartTime).getDate()}
              </span>
            </div>

            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs text-ink-mute">
                <CalendarClockIcon className="size-3.5 text-ink-faint" aria-hidden />
                <time dateTime={toDateTimeAttr(booking.eventStartTime)}>
                  {formatDate(booking.eventStartTime)} · {formatTime(booking.eventStartTime)}
                </time>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                <MapPinIcon className="size-3.5" aria-hidden />
                {booking.venueName}
              </p>
            </div>
          </div>

          {/* What */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="min-w-0">
                <Link
                  href={
                    booking.status === 'CONFIRMED'
                      ? `/booking/${booking.id}/success`
                      : `/events/${booking.eventId}`
                  }
                  className="rounded-xs text-base font-medium text-ink transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-gold-100"
                >
                  {booking.eventTitle}
                </Link>
              </h3>

              <Badge variant={STATUS_VARIANT[booking.status]} className="shrink-0">
                {BOOKING_STATUS_LABEL[booking.status]}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-mute">
              <span className="font-mono">{booking.bookingNumber}</span>
              <span className="flex items-center gap-1.5">
                <TicketIcon className="size-3.5 text-ink-faint" aria-hidden />
                {booking.seatCount} {booking.seatCount === 1 ? 'seat' : 'seats'}
                <span className="hidden font-mono text-ink-faint sm:inline">
                  ({booking.seatLabels.slice(0, 3).join(', ')}
                  {booking.seatLabels.length > 3 ? ` +${booking.seatLabels.length - 3}` : ''})
                </span>
              </span>
              <span className="tabular-nums text-gold-300">
                {formatPreciseCurrency(booking.totalAmount)}
              </span>
            </div>

            {pending && <Progress value={72} label="Time left on seat hold" className="mt-3 max-w-xs" />}
          </div>

          {/* Action */}
          <div className="shrink-0">
            <Button
              asChild
              variant={booking.status === 'CONFIRMED' ? 'primary' : 'outline'}
              size="sm"
            >
              <Link
                href={
                  booking.status === 'CONFIRMED'
                    ? `/booking/${booking.id}/success`
                    : booking.status === 'PENDING'
                      ? `/checkout?booking=${booking.id}`
                      : `/events/${booking.eventId}`
                }
              >
                {booking.status === 'CONFIRMED'
                  ? 'View tickets'
                  : booking.status === 'PENDING'
                    ? 'Finish checkout'
                    : 'Book again'}
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </li>
  )
}

/** Compact grouped header used between booking sections. */
export function BookingGroupHeading({
  title,
  count,
  tone = 'default',
}: {
  title: string
  count: number
  tone?: 'default' | 'live'
}) {
  return (
    <div className="flex items-center justify-between gap-4 pb-1">
      <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
        {tone === 'live' && (
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal-live/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-signal-live" />
          </span>
        )}
        {title}
      </h2>
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">{count}</span>
    </div>
  )
}

/** Empty state for a customer with no bookings at all. */
export function NoBookings() {
  return (
    <div className="rounded-lg border border-dashed border-white/12 bg-carbon/40 px-6 py-16 text-center">
      <TicketIcon className="mx-auto size-8 text-ink-faint" aria-hidden />
      <p className="mt-4 text-base font-medium text-ink">No bookings yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">
        When you pick a seat, the hold and every ticket land here automatically.
      </p>
      <Button asChild variant="primary" size="lg" className="mt-6">
        <Link href="/events">Browse events</Link>
      </Button>
    </div>
  )
}
