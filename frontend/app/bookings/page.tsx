import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import {
  BookingGroupHeading,
  BookingRow,
  NoBookings,
} from '@/components/bookings/booking-row'
import { LiveHoldBanner } from '@/components/bookings/live-hold-banner'
import { getServerServices } from '@/lib/api/server'
import { ROUTES } from '@/lib/constants'
import type { BookingListItem } from '@/types/booking'

export const metadata: Metadata = {
  title: 'My bookings',
  description: 'Every Ticket Flow booking, seat and ticket in one place.',
  robots: { index: false, follow: false },
}

/**
 * Customer booking history (FR-AUTH-05).
 *
 * Grouped by lifecycle rather than a flat date sort: an abandoned hold is a
 * different thing from a confirmed ticket, and burying it at the bottom of a
 * timeline hides the one row that still needs action.
 */
export default async function BookingsPage() {
  const services = getServerServices()
  const [profile, bookings, activeHold] = await Promise.all([
    services.users.me(),
    services.bookings.list(),
    services.bookings.activeHold(),
  ])

  if (!profile) redirect(`/login?next=${ROUTES.bookings}`)

  const groups = groupBookings(bookings)
  const hasBookings = bookings.length > 0

  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <SectionHeading
          as="h1"
          eyebrow="Your account"
          title={`Bookings${profile ? `, ${profile.fullName.split(' ')[0]}` : ''}`}
          lede="Confirmed tickets are ready to scan. Anything still holding a seat needs payment before the timer runs out."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Stat label="Total bookings" value={profile.stats.totalBookings} />
          <Stat label="Upcoming" value={profile.stats.upcomingBookings} accent />
          <Stat label="Seats booked" value={profile.stats.seatsAttended} />
        </div>

        <LiveHoldBanner initialHold={activeHold} className="mt-8" />

        {!hasBookings ? (
          <NoBookings />
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {groups.pending.length > 0 && (
              <section aria-labelledby="pending-bookings" className="flex flex-col gap-3">
                <div id="pending-bookings">
                  <BookingGroupHeading title="Awaiting payment" count={groups.pending.length} tone="live" />
                </div>
                <ul className="flex flex-col gap-3">
                  {groups.pending.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            )}

            {groups.upcoming.length > 0 && (
              <section aria-labelledby="upcoming-bookings" className="flex flex-col gap-3">
                <div id="upcoming-bookings">
                  <BookingGroupHeading title="Upcoming events" count={groups.upcoming.length} />
                </div>
                <ul className="flex flex-col gap-3">
                  {groups.upcoming.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            )}

            {groups.past.length > 0 && (
              <section aria-labelledby="past-bookings" className="flex flex-col gap-3">
                <div id="past-bookings">
                  <BookingGroupHeading title="Past events" count={groups.past.length} />
                </div>
                <ul className="flex flex-col gap-3">
                  {groups.past.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            )}

            {groups.closed.length > 0 && (
              <section aria-labelledby="closed-bookings" className="flex flex-col gap-3">
                <div id="closed-bookings">
                  <BookingGroupHeading title="Cancelled & expired" count={groups.closed.length} />
                </div>
                <ul className="flex flex-col gap-3">
                  {groups.closed.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-white/8 bg-carbon-2/40 px-4 py-3">
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${accent ? 'text-gold-200' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

/**
 * Ordering is intentional within each group: soonest first for anything still
 * actionable, most recent first for history.
 */
function groupBookings(bookings: BookingListItem[]) {
  const byEventDate = (a: BookingListItem, b: BookingListItem) =>
    new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()

  return {
    pending: bookings.filter((b) => b.status === 'PENDING').sort(byEventDate),
    upcoming: bookings
      .filter((b) => b.status === 'CONFIRMED' && b.isUpcoming)
      .sort(byEventDate),
    past: bookings
      .filter((b) => b.status === 'CONFIRMED' && !b.isUpcoming)
      .sort((a, b) => byEventDate(b, a)),
    closed: bookings
      .filter((b) => b.status === 'CANCELLED' || b.status === 'EXPIRED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }
}
