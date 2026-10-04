import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarClockIcon, MapPinIcon, ReceiptIcon, TicketIcon, XCircleIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PriceBreakdown } from '@/components/checkout/price-breakdown'
import { CancelBookingButton } from '@/components/bookings/cancel-booking-button'
import { getServerServices } from '@/lib/api/server'
import { BOOKING_STATUS_LABEL } from '@/types/booking'
import { formatDate, formatPreciseCurrency, formatTime, toDateTimeAttr } from '@/lib/format'

type Params = Promise<{ bookingId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bookingId } = await params
  const booking = await getServerServices().bookings.getById(bookingId)

  return {
    title: booking ? `Booking ${booking.bookingNumber}` : 'Booking not found',
    robots: { index: false, follow: false },
  }
}

/**
 * Full booking record.
 *
 * Distinct from `/booking/[id]/success` on purpose: that screen is the receipt,
 * shown once immediately after payment. This one is the durable record, so it
 * shows the same facts at any time, including for cancelled and expired bookings
 * where no tickets were ever issued.
 */
export default async function BookingDetailPage({ params }: { params: Params }) {
  const { bookingId } = await params
  const booking = await getServerServices().bookings.getById(bookingId)

  if (!booking) notFound()

  const cancelled = booking.status === 'CANCELLED' || booking.status === 'EXPIRED'

  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <li>
              <Link href="/bookings" className="rounded-xs hover:text-gold-300">
                My bookings
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-mono text-ink-mute">{booking.bookingNumber}</li>
          </ol>
        </nav>

        <SectionHeading
          as="h1"
          eyebrow={BOOKING_STATUS_LABEL[booking.status]}
          title={booking.eventTitle}
          lede={`Booked ${formatDate(booking.createdAt)}${
            booking.confirmedAt ? ` · confirmed ${formatDate(booking.confirmedAt)}` : ''
          }`}
        >
          <Badge
            variant={
              booking.status === 'CONFIRMED'
                ? 'success'
                : booking.status === 'PENDING'
                  ? 'gold'
                  : booking.status === 'CANCELLED'
                    ? 'danger'
                    : 'warning'
            }
          >
            {BOOKING_STATUS_LABEL[booking.status]}
          </Badge>
        </SectionHeading>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          {/* Facts */}
          <div className="flex flex-col gap-6">
            <section
              aria-labelledby="event-facts"
              className="rounded-lg border border-white/8 bg-carbon p-5 sm:p-6"
            >
              <h2 id="event-facts" className="text-sm font-medium text-ink">
                Event
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                    <CalendarClockIcon className="size-3" aria-hidden /> Date
                  </dt>
                  <dd className="mt-1.5 text-sm text-ink">
                    <time dateTime={toDateTimeAttr(booking.eventStartTime)}>
                      {formatDate(booking.eventStartTime)} · {formatTime(booking.eventStartTime)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                    <MapPinIcon className="size-3" aria-hidden /> Venue
                  </dt>
                  <dd className="mt-1.5 text-sm text-ink">
                    {booking.venueName}
                    <span className="block text-xs text-ink-mute">
                      {booking.venueLocality}, {booking.venueCity}
                    </span>
                  </dd>
                </div>
              </dl>

              <Separator className="my-5" />

              <h3 className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                <TicketIcon className="size-3" aria-hidden /> Seats
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {booking.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-sm border border-white/8 bg-carbon-2/40 px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {item.section} · {item.row}
                      </span>
                      <span className="font-mono text-xs text-ink-mute">#{item.seatNumber}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs text-ink-mute">{item.tierName}</span>
                      <span className="block font-mono text-xs tabular-nums text-gold-300">
                        {formatPreciseCurrency(item.unitPrice)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* Barcodes are gate-scannable, so they are shown here too — not only on
                  the post-payment receipt. */}
              {booking.status === 'CONFIRMED' && (
                <Button asChild variant="primary" className="mt-5">
                  <Link href={`/booking/${booking.id}/success`}>Open tickets</Link>
                </Button>
              )}
            </section>

            {booking.status === 'PENDING' && (
              <section
                aria-labelledby="pending-actions"
                className="rounded-lg border border-signal-hold/30 bg-signal-hold/8 p-5 sm:p-6"
              >
                <h2 id="pending-actions" className="text-sm font-medium text-ink">
                  This booking is not confirmed
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  {booking.expiresAt
                    ? `Payment is due before ${formatTime(booking.expiresAt)}. After that the seats are released back to the pool automatically.`
                    : 'Payment has not been completed, so these seats have not been confirmed.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/checkout?booking=${booking.id}`}>Finish checkout</Link>
                  </Button>
                  <CancelBookingButton
                    bookingId={booking.id}
                    variant="outline"
                    size="sm"
                    label="Release seats"
                  />
                </div>
              </section>
            )}

            {cancelled && (
              <section
                aria-labelledby="cancelled-notes"
                className="rounded-lg border border-white/10 bg-carbon-2/30 p-5 sm:p-6"
              >
                <h2 id="cancelled-notes" className="flex items-center gap-2 text-sm font-medium text-ink">
                  <XCircleIcon className="size-4 text-ink-faint" aria-hidden />
                  {booking.status === 'CANCELLED' ? 'Booking cancelled' : 'Hold expired'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                  {booking.status === 'CANCELLED'
                    ? 'The seats were released and no payment was captured.'
                    : 'The seat hold ran out before payment completed, so the seats returned to the live map.'}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/events/${booking.eventId}`}>Browse more events</Link>
                </Button>              </section>
            )}
          </div>

          {/* Invoice */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-white/8 bg-carbon p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <ReceiptIcon className="size-4 text-ink-faint" aria-hidden />
                Payment summary
              </h2>
              <div className="mt-4">
                <PriceBreakdown
                  breakdown={booking.pricing}
                  seatLabels={booking.items.map((item) => `${item.section}-${item.row}-${item.seatNumber}`)}
                />
              </div>
              <dl className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-faint">Booking number</dt>
                  <dd className="font-mono text-ink-mute">{booking.bookingNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-faint">Status</dt>
                  <dd className="text-ink-mute">{BOOKING_STATUS_LABEL[booking.status]}</dd>
                </div>
              </dl>

              {booking.status === 'CONFIRMED' && (
                <CancelBookingButton
                  bookingId={booking.id}
                  variant="ghost"
                  size="sm"
                  label="Cancel booking"
                  className="mt-4 w-full"
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
