import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRightIcon, CalendarPlusIcon, CheckCircle2Icon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { TicketCard } from '@/components/bookings/ticket-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getServerServices } from '@/lib/api/server'
import { PriceBreakdown } from '@/components/checkout/price-breakdown'
import { formatDate, formatTime, toDateTimeAttr } from '@/lib/format'
import { ROUTES } from '@/lib/constants'

type Params = Promise<{ bookingId: string }>

/**
 * Only `generateMetadata` — a static `metadata` export alongside it is a hard
 * build error in the App Router. The `robots` directive rides along in both
 * branches so the authenticated surface stays unindexed either way.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bookingId } = await params
  const booking = await getServerServices().bookings.getById(bookingId)

  if (!booking) {
    return { title: 'Booking not found', robots: { index: false, follow: false } }
  }

  return {
    title: `Confirmed — ${booking.eventTitle}`,
    description: `Booking ${booking.bookingNumber} for ${booking.eventTitle}.`,
    robots: { index: false, follow: false },
  }
}

/**
 * Post-payment confirmation.
 *
 * The only screen in the app with an unconditional single primary action, because
 * at this point the user has one goal left: get to the door with the ticket.
 * Every ticket is rendered as a scannable stub, and the same page doubles as the
 * receipt.
 */
export default async function BookingSuccessPage({ params }: { params: Params }) {
  const { bookingId } = await params
  const booking = await getServerServices().bookings.getById(bookingId)

  if (!booking) notFound()

  const confirmed = booking.status === 'CONFIRMED'
  const seatLabels = booking.items.map(
    (item) => `${item.section} · ${item.row}${item.seatNumber}`,
  )

  return (
    <PageShell width="narrow">
      <div className="py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { label: 'Bookings', href: ROUTES.bookings },
            { label: booking.bookingNumber },
          ]}
        />

        {/* Outcome banner */}
        <div className="mt-6 flex flex-col items-center text-center">
          <span
            className={
              confirmed
                ? 'grid size-14 place-items-center rounded-full border border-signal-live/40 bg-signal-live/10 text-signal-live'
                : 'grid size-14 place-items-center rounded-full border border-signal-hold/40 bg-signal-hold/10 text-signal-hold'
            }
          >
            <CheckCircle2Icon className="size-7" aria-hidden />
          </span>

          <h1 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {confirmed ? 'You are going to the show' : 'This booking is not confirmed'}
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
            {confirmed ? (
              <>
                Booking <span className="font-mono text-gold-200">{booking.bookingNumber}</span>{' '}
                is confirmed. Show the ticket below at the gate — a screenshot works fine.
              </>
            ) : (
              <>
                This booking is currently{' '}
                <span className="text-ink-soft">{booking.status.toLowerCase()}</span>. The
                seats may have been released back to other buyers.
              </>
            )}
          </p>
        </div>

        {/* Event recap */}
        <Card className="mt-8">
          <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium text-ink">{booking.eventTitle}</h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-mute">
                  <time dateTime={toDateTimeAttr(booking.eventStartTime)}>
                    {formatDate(booking.eventStartTime)}
                  </time>
                  <span className="tabular-nums">{formatTime(booking.eventStartTime)}</span>
                </p>
                <p className="mt-0.5 text-sm text-ink-mute">
                  {booking.venueName}, {booking.venueLocality}
                </p>
              </div>

              <Button asChild variant="secondary" size="sm" className="shrink-0">
                <Link href={`/events/${booking.eventId}`}>
                  Event
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <section className="mt-8" aria-labelledby="tickets">
          <h2 id="tickets" className="text-sm font-medium text-ink">
            {booking.items.length === 1 ? 'Your ticket' : `Your ${booking.items.length} tickets`}
          </h2>

          <ul className="mt-3 flex flex-col gap-3">
            {booking.items.map((item) => (
              <li key={item.id}>
                <TicketCard item={item} booking={booking} />
              </li>
            ))}
          </ul>
        </section>

        {/* Receipt */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceBreakdown breakdown={booking.pricing} seatLabels={seatLabels} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg" className="flex-1">
            <Link href={ROUTES.bookings}>
              <CalendarPlusIcon aria-hidden />
              View all bookings
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href={ROUTES.events}>Find another event</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
