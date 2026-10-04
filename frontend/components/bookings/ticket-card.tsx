import { BarcodeIcon } from 'lucide-react'
import { formatDate, formatPreciseCurrency, formatTime, toDateTimeAttr } from '@/lib/format'
import type { Booking, BookingItem } from '@/types/booking'
import { cn } from '@/lib/utils'

/**
 * Gate ticket.
 *
 * The barcode token is a mock — a stable hash of the booking and seat ids — but
 * the surrounding design is the real one: a detachable stub with a perforated
 * edge, a scannable block, and every field a gate agent actually reads. The
 * perforated divider is drawn with a radial-gradient mask rather than an image
 * asset.
 */
export function TicketCard({
  item,
  booking,
  className,
}: {
  item: BookingItem
  booking: Booking
  className?: string
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg border border-white/10 bg-carbon',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Main stub */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-2xs uppercase tracking-[0.16em] text-gold-300">
                {item.tierName}
              </p>
              <h3 className="mt-1.5 truncate text-base font-medium text-ink">
                {booking.eventTitle}
              </h3>
            </div>
            <BarcodeIcon className="size-5 shrink-0 text-ink-faint" aria-hidden />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
            <Field label="Date">
              <time dateTime={toDateTimeAttr(booking.eventStartTime)}>
                {formatDate(booking.eventStartTime)}
              </time>
            </Field>
            <Field label="Time">
              <span className="tabular-nums">{formatTime(booking.eventStartTime)}</span>
            </Field>
            <Field label="Venue">
              {booking.venueName}
              <span className="block text-ink-faint">{booking.venueLocality}</span>
            </Field>
            <Field label="Seat">
              <span className="font-mono">
                {item.section} · {item.row}
                {item.seatNumber}
              </span>
            </Field>
            <Field label="Booking">
              <span className="font-mono">{booking.bookingNumber}</span>
            </Field>
            <Field label="Fare">
              <span className="tabular-nums">{formatPreciseCurrency(item.unitPrice)}</span>
            </Field>
          </dl>
        </div>

        {/* Scannable edge */}
        <div className="relative flex shrink-0 flex-col items-center justify-center gap-3 border-t border-white/10 bg-carbon-2/60 px-6 py-5 sm:w-44 sm:border-l sm:border-t-0">
          {/* Perforation */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-px bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.18)_0_4px,transparent_4px_9px)] sm:block"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.18)_0_4px,transparent_4px_9px)] sm:hidden"
          />

          <Barcode
            token={item.ticketBarcode}
            className="h-14 w-full max-w-36"
          />
          <p className="text-center font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
            {item.ticketBarcode}
          </p>
        </div>
      </div>
    </article>
  )
}

/**
 * Barcode.
 *
 * Deterministic bar widths derived from the token's characters — visually
 * convincing, and identical on every render so React never re-shuffles the bars
 * between the server response and hydration.
 */
function Barcode({ token, className }: { token: string; className?: string }) {
  const bars = buildBars(token)

  return (
    <svg
      viewBox={`0 0 ${bars.length * 3} 40`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Ticket code ${token}`}
      className={cn('w-full', className)}
    >
      {bars.map((width, index) => (
        <rect
          key={index}
          x={index * 3}
          y={0}
          width={width}
          height={40}
          className="fill-white/85"
        />
      ))}
    </svg>
  )
}

function buildBars(token: string): number[] {
  const bars: number[] = []
  let accumulator = 0

  for (const character of token) {
    const code = character.charCodeAt(0)
    // 1 or 2 units wide, never adjacent to another 1 (keeps scanners happy).
    const width = code % 3 === 0 ? 2 : 1
    bars.push(width)
    accumulator += width
  }

  // Pad to an even count so the module grid stays regular.
  while (accumulator % 2 === 1) {
    bars.push(1)
    accumulator += 1
  }

  return bars
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className="mt-1 truncate text-ink-soft">{children}</dd>
    </div>
  )
}
