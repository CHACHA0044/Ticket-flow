import Link from 'next/link'
import { ArrowRightIcon, CalendarDaysIcon, LockIcon, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventPoster } from '@/components/events/event-poster'
import type { EventSummary } from '@/types/event'
import { formatCompactNumber, formatCurrency } from '@/lib/format'
import { MONO_LABEL } from '@/lib/styles'

/**
 * Landing hero.
 *
 * One primary action, one secondary. The right-hand panel is a live seat-map
 * fragment rather than a marketing illustration — it shows the actual product
 * mechanic within a second of arrival, and reuses the same poster and legend
 * vocabulary as the real seat screen.
 */
export function Hero({ featured }: { featured: EventSummary | null }) {
  return (
    <section className="relative overflow-hidden border-b border-white/8">
      {/* Ambient gold bloom + technical grid */}
      <div aria-hidden className="tf-grid absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-gold-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-void"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className={MONO_LABEL}>
            <span className="mr-2 inline-block size-1.5 rounded-full bg-gold-400 align-middle" aria-hidden />
            Real-time seat access
          </p>

          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Pick the exact seat.
            <span className="block tf-metal-text">We hold it while you pay.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-mute sm:text-lg">
            Live availability for every seat in the venue, a ten-minute hold the moment
            you choose, and a single clean checkout. No overselling, no refreshing,
            no guessing where you sit.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="xl">
              <Link href="/events">
                Browse events
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/8 pt-6">
            {[
              { label: 'Hold window', value: '10 min' },
              { label: 'Seats per order', value: 'Up to 6' },
              { label: 'Oversell risk', value: 'Zero' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 text-lg font-medium tracking-tight text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product fragment */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-2xl bg-linear-to-br from-gold-500/8 to-transparent blur-2xl"
          />
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-carbon-2/70 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <p className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
                Live availability
              </p>
              <span className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-signal-live">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal-live/70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-signal-live" />
                </span>
                Live
              </span>
            </div>

            {featured ? (
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <EventPoster
                    poster={featured.poster}
                    title={featured.title}
                    shape="thumb"
                    className="w-16 shrink-0 rounded-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{featured.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-mute">
                      {featured.venue.name} · {featured.venue.locality}
                    </p>
                    <p className="mt-1 font-mono text-2xs uppercase tracking-[0.12em] text-gold-300">
                      From {formatCurrency(featured.minPrice)}
                    </p>
                  </div>
                </div>

                <SeatMapFragment />

                <div className="flex items-center justify-between border-t border-white/8 pt-3 text-xs text-ink-mute">
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="size-3.5 text-ink-faint" aria-hidden />
                    {formatCompactNumber(featured.availableSeats)} seats left
                  </span>
                  <Button asChild size="sm" variant="primary">
                    <Link href={`/events/${featured.id}/seats`}>Choose seats</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <SeatMapFragment />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Miniature seat grid.
 *
 * Purely decorative — `aria-hidden`, with the same visual vocabulary the real
 * map uses (available / selected / held / sold) so the hero is an honest
 * preview rather than an unrelated illustration.
 */
function SeatMapFragment() {
  const grid = Array.from({ length: 48 }, (_, index) => {
    if (index % 13 === 0 || index % 17 === 5) return 'sold'
    if (index === 7 || index === 20 || index === 34) return 'held'
    if (index === 10 || index === 25) return 'selected'
    return 'available'
  })

  const tone: Record<string, string> = {
    available: 'bg-white/10 ring-1 ring-inset ring-white/12',
    sold: 'bg-white/[0.03] ring-1 ring-inset ring-white/5',
    held: 'bg-signal-hold/25 ring-1 ring-inset ring-signal-hold/40',
    selected: 'bg-gold-400 ring-0',
  }

  return (
    <div aria-hidden className="rounded-md border border-white/8 bg-carbon/60 p-3">
      <div className="mx-auto mb-3 h-1.5 w-24 rounded-full bg-linear-to-r from-transparent via-gold-400/45 to-transparent" />
      <div className="grid grid-cols-12 gap-1">
        {grid.map((state, index) => (
          <span
            key={index}
            className={`aspect-square rounded-[2px] ${tone[state]}`}
            style={state === 'held' ? { animationDelay: `${index * 40}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  )
}

/** Three-up explanation strip. Reused on the home page and /how-it-works. */
export const HERO_POINTS = [
  {
    icon: ZapIcon,
    title: 'Availability is live',
    body: 'Every seat transition arrives over a real-time channel, so the map you are looking at is the map other buyers are looking at.',
  },
  {
    icon: LockIcon,
    title: 'Your seat is locked',
    body: 'Choosing seats takes a distributed hold immediately. If someone else was faster, we tell you before you reach checkout.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Ticket on your phone',
    body: 'One checkout, one verifiable ticket per seat, and the whole booking in your account the moment payment clears.',
  },
] as const
