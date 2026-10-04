import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { SectionHeading } from '@/components/layout/section-heading'
import { EventPoster } from '@/components/events/event-poster'
import { EventCard } from '@/components/events/event-card'
import { VenueSchematic, VenueSchematicLegend } from '@/components/events/venue-schematic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getServerServices } from '@/lib/api/server'
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  formatTime,
  toDateTimeAttr,
} from '@/lib/format'
import { ROUTES } from '@/lib/constants'
import { EVENT_CATEGORY_LABEL, type Event } from '@/types/event'

type Params = Promise<{ eventId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { eventId } = await params
  const event = await getServerServices().events.getById(eventId)
  if (!event) return { title: 'Event not found' }

  return {
    title: event.title,
    description: `${event.tagline}. ${formatDate(event.startTime)} at ${event.venue.name}, ${event.venue.locality}. Choose exact seats with live availability.`,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      type: 'website',
      title: event.title,
      description: event.tagline,
      url: `/events/${event.id}`,
    },
  }
}

/** `Event` structured data so individual shows are eligible for rich results. */
function EventJsonLd({ event }: { event: Event }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.tagline,
    startDate: event.startTime,
    endDate: event.endTime,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue.address,
        addressLocality: event.venue.locality,
        addressRegion: event.venue.city,
        addressCountry: 'IN',
      },
    },
    offers: {
      '@type': 'Offer',
      price: event.minPrice,
      priceCurrency: event.currency,
      availability: event.availableSeats > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `/events/${event.id}`,
      validFrom: event.salesOpenAt,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { eventId } = await params
  const services = getServerServices()
  const event = await services.events.getById(eventId)

  if (!event) notFound()

  const snapshot = await services.seats.getSnapshot(eventId)
  const related = await services.events.related(eventId, 3)

  const availabilityBySection: Record<string, number> = {}
  if (snapshot) {
    for (const section of event.venue.sections) {
      availabilityBySection[section.code] = snapshot.seats.filter(
        (seat) => seat.section === section.code && seat.status === 'AVAILABLE',
      ).length
    }
  }

  const soldOut = !snapshot || snapshot.totals.available === 0

  return (
    <PageShell>
      <EventJsonLd event={event} />

      <div className="py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { label: 'Events', href: ROUTES.events },
            { label: EVENT_CATEGORY_LABEL[event.category], href: `${ROUTES.events}?category=${event.category}` },
            { label: event.title },
          ]}
        />

        {/* Header panel */}
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-carbon">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="order-2 flex flex-col gap-6 p-6 lg:order-1 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">{EVENT_CATEGORY_LABEL[event.category]}</Badge>
                {soldOut ? (
                  <Badge variant="danger">Sold out</Badge>
                ) : snapshot && snapshot.totals.available / snapshot.totals.total < 0.15 ? (
                  <Badge variant="warning">Selling fast</Badge>
                ) : (
                  <Badge variant="success">On sale</Badge>
                )}
                {event.requiresWaitingRoom && <Badge variant="info">High demand</Badge>}
              </div>

              <div>
                <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                  {event.title}
                </h1>
                <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-mute">
                  {event.tagline}
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={<CalendarIcon className="size-4" aria-hidden />} label="Date">
                  <time dateTime={toDateTimeAttr(event.startTime)}>
                    {formatDate(event.startTime)}
                  </time>
                </DetailRow>

                <DetailRow icon={<ClockIcon className="size-4" aria-hidden />} label="Doors & duration">
                  <span className="tabular-nums">{formatTime(event.startTime)}</span>
                  <span className="text-ink-faint"> · {formatDuration(event.startTime, event.endTime)}</span>
                </DetailRow>

                <DetailRow icon={<MapPinIcon className="size-4" aria-hidden />} label="Venue">
                  {event.venue.name}
                  <span className="block text-xs text-ink-faint">
                    {event.venue.address}, {event.venue.locality}
                  </span>
                </DetailRow>

                <DetailRow icon={<UsersIcon className="size-4" aria-hidden />} label="Availability">
                  {soldOut ? (
                    <span className="text-signal-alert">No seats remaining</span>
                  ) : (
                    <>
                      <span className="tabular-nums">{formatNumber(snapshot.totals.available)}</span>
                      <span className="text-ink-faint"> of {formatNumber(snapshot.totals.total)} open</span>
                    </>
                  )}
                </DetailRow>
              </dl>

              <div className="flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
                <Button asChild variant="primary" size="xl" disabled={soldOut}>
                  <Link href={`/events/${event.id}/seats`} aria-disabled={soldOut || undefined}>
                    <TicketIcon aria-hidden />
                    {soldOut ? 'Sold out' : 'Choose your seats'}
                  </Link>
                </Button>
                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                  From {formatCurrency(event.minPrice)} · held for 10 minutes
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <EventPoster
                poster={event.poster}
                title={event.title}
                shape="hero"
                decorative={false}
                className="size-full lg:rounded-l-none"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <div className="flex flex-col gap-8">
            <section aria-labelledby="about">
              <h2 id="about" className="text-lg font-medium tracking-tight text-ink">
                About this event
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-ink-mute">
                {event.description}
              </p>

              {event.highlights.length > 0 && (
                <ul className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {event.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-gold-400/70"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="plan">
              <div className="flex items-end justify-between gap-4">
                <h2 id="plan" className="text-lg font-medium tracking-tight text-ink">
                  Seating plan
                </h2>
                <VenueSchematicLegend />
              </div>

              <Card className="mt-4">
                <CardContent className="pt-5 sm:pt-6">
                  <VenueSchematic
                    venue={event.venue}
                    availabilityBySection={availabilityBySection}
                    className="mx-auto max-w-3xl"
                  />
                </CardContent>
              </Card>

              <p className="mt-3 text-xs text-ink-faint">
                Availability shown is the live count at the time this page loaded. Seat
                status updates continuously as other buyers transact.
              </p>
            </section>

            <section aria-labelledby="pricing">
              <h2 id="pricing" className="text-lg font-medium tracking-tight text-ink">
                Ticket tiers
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {event.pricingTiers.map((tier) => {
                  const available = snapshot
                    ? snapshot.seats.filter(
                        (seat) => seat.category === tier.tierName && seat.status === 'AVAILABLE',
                      ).length
                    : 0

                  return (
                    <li key={tier.tierName}>
                      <Card className="flex h-full flex-col p-5">
                        <p className="font-mono text-2xs uppercase tracking-[0.16em] text-gold-300">
                          {tier.tierName}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                          {formatCurrency(tier.price)}
                        </p>
                        <p className="mt-1 text-xs text-ink-mute">
                          Per seat, inclusive of taxes shown at checkout
                        </p>
                        {tier.perk && (
                          <p className="mt-3 text-xs leading-relaxed text-ink-faint">{tier.perk}</p>
                        )}
                        <p className="mt-auto pt-4 font-mono text-2xs uppercase tracking-[0.12em] text-ink-mute">
                          {available > 0 ? `${formatNumber(available)} available` : 'Unavailable'}
                        </p>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Your seats, held instantly</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3 text-sm text-ink-mute">
                  {[
                    'Pick up to 6 seats in one transaction.',
                    'Seats are locked the moment you select them.',
                    'Ten minutes to pay — no more, no less.',
                    'If someone is faster, we tell you before checkout.',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-gold-400/70"
                      />
                      {line}
                    </li>
                  ))}
                </ul>

                <Button asChild variant="primary" block className="mt-6" disabled={soldOut}>
                  <Link href={`/events/${event.id}/seats`}>
                    {soldOut ? 'Sold out' : 'Open seat map'}
                    {!soldOut && <ArrowRightIcon aria-hidden />}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-ink">{event.venue.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-mute">
                  {event.venue.address}
                  <br />
                  {event.venue.locality}, {event.venue.city}
                </p>
                <p className="mt-3 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                  Capacity {formatNumber(event.venue.capacity)}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-white/8 pt-12" aria-labelledby="related">
            <SectionHeading as="h2" eyebrow="Also on" title="You might like these too">
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href={ROUTES.events}>
                  All events
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
            </SectionHeading>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <EventCard event={item} className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gold-400/70">{icon}</span>
      <div className="min-w-0">
        <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </dt>
        <dd className="mt-1 text-sm text-ink">{children}</dd>
      </div>
    </div>
  )
}
