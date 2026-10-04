import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, MapPinIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { SeatSelectionScreen } from '@/components/seats/seat-selection-screen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServerServices } from '@/lib/api/server'
import { formatDate, formatTime, toDateTimeAttr } from '@/lib/format'
import { ROUTES } from '@/lib/constants'
import { EVENT_CATEGORY_LABEL } from '@/types/event'

type Params = Promise<{ eventId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { eventId } = await params
  const event = await getServerServices().events.getById(eventId)
  if (!event) return { title: 'Event not found' }

  return {
    title: `Choose seats — ${event.title}`,
    description: `Pick your exact seats for ${event.title} at ${event.venue.name}. Live availability, held for 10 minutes.`,
    alternates: { canonical: `/events/${event.id}/seats` },
    // Seat selection is a transactional surface — keep it out of the index.
    robots: { index: false, follow: true },
  }
}

/**
 * Seat selection route.
 *
 * The snapshot is fetched on the server and handed to the client screen as
 * initial state, so the venue plan is painted in the first HTML response. The
 * client then keeps it current over the real-time channel rather than polling.
 */
export default async function SeatSelectionPage({ params }: { params: Params }) {
  const { eventId } = await params
  const services = getServerServices()
  const [event, snapshot] = await Promise.all([
    services.events.getById(eventId),
    services.seats.getSnapshot(eventId),
  ])

  if (!event || !snapshot) notFound()

  return (
    <PageShell width="wide">
      <div className="py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { label: 'Events', href: ROUTES.events },
            { label: event.title, href: `/events/${event.id}` },
            { label: 'Choose seats' },
          ]}
        />

        <div className="mt-5 flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold">{EVENT_CATEGORY_LABEL[event.category]}</Badge>
              <Badge variant="outline">Seats held for 10 minutes</Badge>
            </div>

            <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Choose your seats
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-mute">
              <Link
                href={`/events/${event.id}`}
                className="rounded-xs text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
              >
                {event.title}
              </Link>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-ink-faint" aria-hidden />
                <time dateTime={toDateTimeAttr(event.startTime)}>
                  {formatDate(event.startTime)}
                </time>
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <ClockIcon className="size-3.5 text-ink-faint" aria-hidden />
                {formatTime(event.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 text-ink-faint" aria-hidden />
                {event.venue.name}
              </span>
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="w-fit shrink-0">
            <Link href={`/events/${event.id}`}>
              <ArrowLeftIcon aria-hidden />
              Event details
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          <SeatSelectionScreen event={event} initialSnapshot={snapshot} />
        </div>
      </div>
    </PageShell>
  )
}
