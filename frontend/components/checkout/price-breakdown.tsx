import { formatPreciseCurrency } from '@/lib/format'
import type { PriceBreakdown as PriceBreakdownData } from '@/types/booking'
import { cn } from '@/lib/utils'

/**
 * Invoice.
 *
 * Line items are grouped by tier (not listed per seat) because six seats at three
 * tiers is a table nobody reads; the seat-level detail is printed underneath as
 * a compact monospace strip so the customer can still verify each seat against
 * the plan they picked. Totals are the visually dominant element.
 */
export function PriceBreakdown({
  breakdown,
  seatLabels,
  className,
}: {
  breakdown: PriceBreakdownData
  seatLabels: string[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <ul className="flex flex-col gap-3">
        {breakdown.lines.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className={cn('text-ink', line.emphasis === 'muted' && 'text-ink-mute')}>
                {line.label}
                {line.quantity > 1 && (
                  <span className="ml-1.5 font-mono text-2xs text-ink-faint">
                    ×{line.quantity}
                  </span>
                )}
              </p>
              {line.detail && (
                <p className="mt-0.5 truncate text-xs text-ink-faint">{line.detail}</p>
              )}
            </div>
            <p className="shrink-0 tabular-nums text-ink-soft">
              {formatPreciseCurrency(line.amount)}
            </p>
          </li>
        ))}
      </ul>

      {seatLabels.length > 0 && (
        <div className="rounded-sm border border-white/8 bg-carbon-2/60 px-3 py-2.5">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
            Seats
          </p>
          <p className="mt-1.5 font-mono text-xs leading-relaxed text-ink-soft">
            {seatLabels.join('   ')}
          </p>
        </div>
      )}

      <dl className="flex flex-col gap-2 border-t border-white/10 pt-4 text-sm">
        <Row label="Ticket subtotal" value={formatPreciseCurrency(breakdown.subtotal)} />
        <Row
          label="Fees & taxes"
          value={formatPreciseCurrency(
            breakdown.convenienceFee + breakdown.platformFee + breakdown.taxes,
          )}
        />
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="text-base font-medium text-ink">Total payable</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums text-gold-200">
            {formatPreciseCurrency(breakdown.total)}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-ink-faint">
        Amounts are in {breakdown.currency}. Payment runs in test mode — no money
        leaves your account and no real tickets are issued.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="tabular-nums text-ink-soft">{value}</dd>
    </div>
  )
}
