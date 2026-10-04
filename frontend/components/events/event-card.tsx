import Link from 'next/link'
import { CalendarIcon, MapPinIcon, ZapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EventPoster } from '@/components/events/event-poster'
import {
  formatCompactNumber,
  formatCurrency,
  formatDayMonth,
  formatTime,
  toDateTimeAttr,
} from '@/lib/format'
import { EVENT_CATEGORY_LABEL } from '@/types/event'
import type { EventSummary } from '@/types/event'
import { cn } from '@/lib/utils'

/**
 * Catalogue card.
 *
 * The whole card is one link target; the title carries the accessible name and
 * the supporting facts are plain text, so a screen reader reads a single coherent
 * summary instead of five disconnected fragments. A stretched pseudo-element
 * makes the entire surface clickable without nesting interactive elements.
 */
export function EventCard({ event, className }: { event: EventSummary; className?: string }) {
  const soldOut = event.availableSeats === 0
  const nearlyGone = !soldOut && event.isSellingFast

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-white/8 bg-carbon',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-gold-400/35 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.95)]',
        'motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      <div className="relative overflow-hidden">
        <EventPoster
          poster={event.poster}
          title={event.title}
          shape="card"
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge variant="outline" className="border-white/20 bg-void/60 text-ink-soft backdrop-blur-sm">
            {EVENT_CATEGORY_LABEL[event.category]}
          </Badge>
          {soldOut ? (
            <Badge variant="danger" className="backdrop-blur-sm">Sold out</Badge>
          ) : nearlyGone ? (
            <Badge variant="warning" className="backdrop-blur-sm">
              <ZapIcon aria-hidden />
              Selling fast
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
          <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
          <time dateTime={toDateTimeAttr(event.startTime)}>
            {formatDayMonth(event.startTime)} · {formatTime(event.startTime)}
          </time>
        </div>

        <h3 className="text-balance text-base font-medium leading-snug text-ink transition-colors duration-150 group-hover:text-gold-100">
          <Link href={`/events/${event.id}`} className="rounded-xs after:absolute after:inset-0 after:content-['']">
            {event.title}
          </Link>
        </h3>

        <p className="flex items-center gap-2 text-xs text-ink-mute">
          <MapPinIcon className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
          <span className="truncate">
            {event.venue.name} · {event.venue.locality}
          </span>
        </p>

        <div className="mt-auto pt-1">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs text-ink-faint">
              from{' '}
              <span className="font-mono text-sm font-medium text-ink">
                {formatCurrency(event.minPrice)}
              </span>
            </p>
            <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
              {soldOut
                ? 'Unavailable'
                : `${formatCompactNumber(event.availableSeats)} left`}
            </p>
          </div>

          <Progress
            value={event.soldPercentage}
            label={`${event.soldPercentage}% of seats sold`}
            className="mt-2"
            indicatorClassName={soldOut ? 'bg-signal-alert/70' : undefined}
          />
        </div>
      </div>
    </article>
  )
}

/** Compact horizontal variant used in carousels and "you may also like" rails. */
export function EventCardCompact({ event }: { event: EventSummary }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        'group relative flex w-64 shrink-0 snap-start items-center gap-3 rounded-md border border-white/8 bg-carbon p-3',
        'transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-gold-400/35',
        'motion-reduce:transform-none motion-reduce:transition-none',
      )}
    >
      <EventPoster poster={event.poster} title={event.title} shape="thumb" className="w-14 shrink-0 rounded-sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-gold-100">
          {event.title}
        </p>
        <p className="mt-1 truncate text-xs text-ink-mute">
          {formatDayMonth(event.startTime)} · {event.venue.locality}
        </p>
        <p className="mt-1 font-mono text-2xs uppercase tracking-[0.12em] text-gold-300">
          {formatCurrency(event.minPrice)}
        </p>
      </div>
    </Link>
  )
}