import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { Hero, HERO_POINTS } from '@/components/marketing/hero'
import { EventCard } from '@/components/events/event-card'
import { Button } from '@/components/ui/button'
import { getServerServices } from '@/lib/api/server'
import { ROUTES } from '@/lib/constants'
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABEL, type EventCategory } from '@/types/event'
import type { EventSummary } from '@/types/event'
import { cn } from '@/lib/utils'

/**
 * Home page.
 *
 * Rendered entirely on the server: the catalogue arrives with the HTML, so the
 * page is indexable and interactive before a single byte of JavaScript runs.
 */
export default async function HomePage() {
  const services = getServerServices()
  const [featured, latest] = await Promise.all([
    services.events.featured(6),
    services.events.list({ sort: 'DATE_ASC' }),
  ])

  const heroEvent = featured[0] ?? latest.items[0] ?? null
  const spotlight = featured.slice(1, 4)
  const byCategory = groupByCategory(latest.items)

  return (
    <PageShell>
      <Hero featured={heroEvent} />

      {/* Featured */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="This week"
          title="Events people are booking right now"
          lede="Ranked by how quickly seats are moving. Everything below updates with live availability as you look at it."
        >
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={ROUTES.events}>
              View all events
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </SectionHeading>

        {spotlight.length > 0 ? (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((event) => (
              <li key={event.id}>
                <EventCard event={event} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-ink-mute">No events are published yet.</p>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-white/8 bg-carbon/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, no refresh button"
            lede="Ticket Flow is built around one guarantee: the seat you chose is the seat you get, or you are told immediately that it is gone."
          />

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {HERO_POINTS.map((point, index) => {
              const Icon = point.icon
              return (
                <li
                  key={point.title}
                  className="relative rounded-lg border border-white/8 bg-carbon p-6"
                >
                  <span
                    aria-hidden
                    className="absolute right-5 top-5 font-mono text-3xl font-bold leading-none text-white/5"
                  >
                    0{index + 1}
                  </span>

                  <span className="grid size-10 place-items-center rounded-sm border border-gold-400/25 bg-gold-400/10 text-gold-300">
                    <Icon className="size-5" aria-hidden />
                  </span>

                  <h3 className="mt-4 text-base font-medium text-ink">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{point.body}</p>
                </li>
              )
            })}
          </ol>

          <div className="mt-10">
            <Button asChild variant="outline">
              <Link href={ROUTES.howItWorks}>
                Read the full walkthrough
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Browse"
          title="Find your kind of night out"
          lede="Five categories, one seat map each. Pick a category and the catalogue is already filtered."
        />

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {EVENT_CATEGORIES.map((category) => {
            const group = byCategory[category]
            const totalSeats = group?.reduce((sum, event) => sum + event.availableSeats, 0) ?? 0

            return (
              <li key={category}>
                <CategoryTile
                  category={category}
                  eventCount={group?.length ?? 0}
                  seatsLeft={totalSeats}
                />
              </li>
            )
          })}
        </ul>
      </section>

      {/* Closer */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-carbon-2 px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="tf-grid absolute inset-0 opacity-70" />
          <div
            aria-hidden
            className="absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[110px]"
          />

          <div className="relative">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Seats are going. Yours takes one tap.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-mute sm:text-base">
              Browse the live catalogue, pick your exact seat in the venue plan, and pay
              once. We will hold it for ten minutes so nobody else can take it while you
              decide.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="primary" size="xl">
                <Link href={ROUTES.events}>
                  Find your seat
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="xl">
                <Link href={ROUTES.register}>Create an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function CategoryTile({
  category,
  eventCount,
  seatsLeft,
}: {
  category: EventCategory
  eventCount: number
  seatsLeft: number
}) {
  const sample = CATEGORY_ACCENT[category]

  return (
    <Link
      href={`${ROUTES.events}?category=${category}`}
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/8 bg-carbon p-4',
        'transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-gold-400/35',
        'motion-reduce:transform-none motion-reduce:transition-none',
      )}
    >
      <span
        aria-hidden
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: sample }}
      />

      <div className="relative">
        <p className="text-sm font-medium text-ink">{EVENT_CATEGORY_LABEL[category]}</p>
        <p className="mt-1 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </p>
      </div>

      <p className="relative mt-6 text-xs text-ink-mute">
        {seatsLeft.toLocaleString('en-IN')} seats open
      </p>
    </Link>
  )
}

/** Per-category colour used only for ambient bloom — never for text contrast. */
const CATEGORY_ACCENT: Record<EventCategory, string> = {
  CONCERT: '#c8a951',
  SPORTS: '#5f8fd6',
  CONFERENCE: '#4fa88b',
  THEATRE: '#b06fd8',
  COMEDY: '#d9764f',
}

function groupByCategory(events: EventSummary[]): Partial<Record<EventCategory, EventSummary[]>> {
  const groups: Partial<Record<EventCategory, EventSummary[]>> = {}
  for (const event of events) {
    const existing = groups[event.category]
    if (existing) existing.push(event)
    else groups[event.category] = [event]
  }
  return groups
}
