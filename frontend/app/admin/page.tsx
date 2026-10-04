import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CpuIcon,
  DatabaseIcon,
  LockIcon,
  MinusIcon,
  RadioIcon,
  ShieldAlertIcon,
  TimerIcon,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OccupancyBars, RevenueAreaChart } from '@/components/admin/charts'
import { getServerServices } from '@/lib/api/server'
import { formatCompactNumber, formatCurrency, formatNumber, formatPercent, formatRelativeTime, formatTime } from '@/lib/format'
import { ROUTES } from '@/lib/constants'
import type { AdminKpi } from '@/types/admin'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Operations dashboard',
  description: 'Booking volume, seat utilisation, revenue and platform health.',
  robots: { index: false, follow: false },
}

/**
 * Operations dashboard (FR-ADMIN-01 / FR-ADMIN-03).
 *
 * Admin-only and server-rendered: every figure comes from the service layer on a
 * single pass, so the numbers on screen are internally consistent with each other
 * rather than assembled from several independently-fetched endpoints.
 */
export default async function AdminPage() {
  const services = getServerServices()
  const profile = await services.users.me()

  if (!profile) redirect(`/login?next=${ROUTES.admin}`)
  if (profile.role !== 'ADMIN') redirect(ROUTES.events)

  const data = await services.admin.dashboard()
  const { health } = data

  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <SectionHeading
          as="h1"
          eyebrow="FR-ADMIN · Operations"
          title="Platform dashboard"
          lede="Booking volume, seat utilisation, revenue and the health of the concurrency layer — the numbers that tell you whether the ticketing path is actually safe under load."
        >
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
            As of {formatTime(data.generatedAt)} ·{' '}
            {formatRelativeTime(data.generatedAt)}
          </p>
        </SectionHeading>

        {/* Integrity banner — the single most important number on the page. */}
        <div
          className={cn(
            'mt-8 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between',
            health.doubleBookingRate === 0
              ? 'border-signal-live/30 bg-signal-live/8'
              : 'border-signal-alert/40 bg-signal-alert/8',
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm',
                health.doubleBookingRate === 0
                  ? 'bg-signal-live/15 text-signal-live'
                  : 'bg-signal-alert/15 text-signal-alert',
              )}
            >
              {health.doubleBookingRate === 0 ? (
                <LockIcon className="size-4" aria-hidden />
              ) : (
                <ShieldAlertIcon className="size-4" aria-hidden />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Double-booking rate: {formatPercent(health.doubleBookingRate, 2)}
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-mute">
                {health.doubleBookingRate === 0
                  ? 'NFR-REL-01 requires 0.00%. Every seat hold in the window was acquired atomically, so no seat was confirmed twice.'
                  : 'Seats were confirmed more than once in this window. Treat every downstream figure as suspect until this returns to zero.'}
              </p>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-4 sm:gap-6">
            <Mini label="Instances" value={String(health.instances)} />
            <Mini label="Connections" value={formatCompactNumber(health.activeConnections)} />
            <Mini label="Queue depth" value={formatNumber(health.queueDepth)} />
          </dl>
        </div>

        {/* KPIs */}
        <section aria-labelledby="kpis" className="mt-8">
          <h2 id="kpis" className="sr-only">
            Key performance indicators
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.kpis.map((kpi) => (
              <li key={kpi.id}>
                <KpiCard kpi={kpi} />
              </li>
            ))}
          </ul>
        </section>

        {/* Revenue + utilisation */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <section aria-labelledby="revenue" className="min-w-0 rounded-lg border border-white/8 bg-carbon p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="revenue" className="text-sm font-medium text-ink">
                Net revenue
              </h2>
              <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                Gross − refunds
              </p>
            </div>

            <div className="mt-5">
              <RevenueAreaChart
                data={data.revenue.map((point) => ({ label: point.label, value: point.net }))}
                format={(value) => formatCompactNumber(value)}
              />
            </div>

            <Separator className="my-5" />

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Gross', value: formatCurrency(data.revenue.reduce((sum, p) => sum + p.gross, 0)) },
                { label: 'Refunds', value: formatCurrency(data.revenue.reduce((sum, p) => sum + p.refunds, 0)) },
                { label: 'Net', value: formatCurrency(data.revenue.reduce((sum, p) => sum + p.net, 0)) },
                { label: 'Bookings', value: formatNumber(data.revenue.reduce((sum, p) => sum + p.bookings, 0)) },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums text-ink-soft">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="utilisation" className="min-w-0 rounded-lg border border-white/8 bg-carbon p-5 sm:p-6">
            <h2 id="utilisation" className="text-sm font-medium text-ink">
              Seat utilisation
            </h2>
            <p className="mt-1 text-xs text-ink-mute">Sold inventory vs. seats currently held.</p>

            <div className="mt-5">
              <OccupancyBars
                data={data.utilisation.map((point) => ({
                  label: point.eventTitle,
                  sold: point.sold,
                  held: point.held,
                  total: point.total,
                  occupancy: point.occupancy,
                }))}
              />
            </div>
          </section>
        </div>

        {/* Event operations */}
        <section aria-labelledby="event-ops" className="mt-6 rounded-lg border border-white/8 bg-carbon">
          <h2 id="event-ops" className="border-b border-white/8 px-5 py-4 text-sm font-medium text-ink sm:px-6">
            Event operations
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">Per-event sales, revenue and lock contention</caption>
              <thead>
                <tr className="border-b border-white/8 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                  <th scope="col" className="px-5 py-3 font-normal sm:px-6">Event</th>
                  <th scope="col" className="px-5 py-3 font-normal">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-normal">Sold</th>
                  <th scope="col" className="px-5 py-3 text-right font-normal">Revenue</th>
                  <th scope="col" className="px-5 py-3 text-right font-normal">Lock contention</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr key={event.id} className="border-b border-white/6 last:border-0 hover:bg-white/3">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link
                        href={`/events/${event.id}`}
                        className="rounded-xs text-ink transition-colors hover:text-gold-200"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-2xs text-ink-faint">
                        {formatTime(event.startTime)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink-soft">
                      {formatNumber(event.seatsSold)}
                      <span className="text-ink-faint"> / {formatNumber(event.seatsTotal)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gold-200">
                      {formatCurrency(event.revenue)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={cn(
                          'tabular-nums',
                          event.lockContentionRate > 0.35 ? 'text-signal-hold' : 'text-ink-soft',
                        )}
                      >
                        {formatPercent(event.lockContentionRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent bookings */}
        <section aria-labelledby="recent-bookings" className="mt-6 rounded-lg border border-white/8 bg-carbon">
          <h2 id="recent-bookings" className="border-b border-white/8 px-5 py-4 text-sm font-medium text-ink sm:px-6">
            Recent bookings
          </h2>

          <ul className="divide-y divide-white/6">
            {data.recentBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="rounded-xs font-mono text-xs text-gold-300 hover:text-gold-200"
                    >
                      {booking.bookingNumber}
                    </Link>
                    <span className="truncate text-sm text-ink">{booking.eventTitle}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {booking.customer} · {booking.seatCount}{' '}
                    {booking.seatCount === 1 ? 'seat' : 'seats'} ·{' '}
                    {formatRelativeTime(booking.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-ink-soft">
                    {formatCurrency(booking.amount)}
                  </span>
                  <Badge variant={bookingVariant(booking.status)}>{booking.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Platform health */}
        <section aria-labelledby="health" className="mt-6">
          <h2 id="health" className="flex items-center gap-2 text-sm font-medium text-ink">
            <ActivityIcon className="size-4 text-ink-faint" aria-hidden />
            Platform health
          </h2>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthCard
              icon={TimerIcon}
              label="API latency (p95)"
              value={`${health.apiLatencyP95} ms`}
              budget="Budget 400 ms"
              ok={health.apiLatencyP95 < 400}
            />
            <HealthCard
              icon={LockIcon}
              label="Lock store latency (p95)"
              value={`${health.redisLatencyP95} ms`}
              budget="Budget 50 ms"
              ok={health.redisLatencyP95 < 50}
            />
            <HealthCard
              icon={CpuIcon}
              label="Event loop lag"
              value={`${health.eventLoopLagMs} ms`}
              budget="Budget 20 ms"
              ok={health.eventLoopLagMs < 20}
            />
            <HealthCard
              icon={DatabaseIcon}
              label="Connection pool"
              value={`${health.mongoPoolInUse} / ${health.mongoPoolSize}`}
              budget={`${health.instances} instance${health.instances === 1 ? '' : 's'}`}
              ok={health.mongoPoolInUse < health.mongoPoolSize}
            />
          </ul>
        </section>
      </div>
    </PageShell>
  )
}

function KpiCard({ kpi }: { kpi: AdminKpi }) {
  const { direction, percentage } = kpi.delta

  return (
    <div className="h-full rounded-lg border border-white/8 bg-carbon p-5">
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">{kpi.label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">
        {kpi.display}
        {kpi.unit && <span className="ml-1 text-sm font-normal text-ink-mute">{kpi.unit}</span>}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-xs">
        {direction === 'up' ? (
          <ArrowUpRightIcon className="size-3.5 text-signal-live" aria-hidden />
        ) : direction === 'down' ? (
          <ArrowDownRightIcon className="size-3.5 text-signal-alert" aria-hidden />
        ) : (
          <MinusIcon className="size-3.5 text-ink-faint" aria-hidden />
        )}
        <span
          className={cn(
            'tabular-nums',
            direction === 'up' ? 'text-signal-live' : direction === 'down' ? 'text-signal-alert' : 'text-ink-faint',
          )}
        >
          {direction === 'flat' ? 'No change' : `${Math.abs(percentage).toFixed(1)}%`}
        </span>
        <span className="text-ink-faint">{kpi.hint}</span>
      </p>
    </div>
  )
}

function HealthCard({
  icon: Icon,
  label,
  value,
  budget,
  ok,
}: {
  icon: LucideIcon
  label: string
  value: string
  budget: string
  ok: boolean
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-white/8 bg-carbon p-4">
      <span
        className={cn(
          'mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm',
          ok ? 'bg-signal-live/12 text-signal-live' : 'bg-signal-hold/14 text-signal-hold',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-mute">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-2xs text-ink-faint">
          <RadioIcon className={cn('size-3', ok ? 'text-signal-live' : 'text-signal-hold')} aria-hidden />
          {ok ? 'Within' : 'Over'} {budget.replace('Budget ', '')}
        </p>
      </div>
    </li>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dd className="text-lg font-semibold tabular-nums text-ink">{value}</dd>
      {/*
         Labels are uppercase mono with wide tracking, so a single word such as
         "CONNECTIONS" can be wider than its grid track on a 320px screen. Without
         breaking, the track's min-content floor widens the whole page.
       */}
      <dt className="break-words font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
    </div>
  )
}

function statusVariant(status: string): 'gold' | 'success' | 'danger' | 'warning' | 'default' {
  const upper = status.toUpperCase()
  if (upper.includes('LIVE') || upper.includes('ON_SALE') || upper.includes('PUBLISHED')) return 'success'
  if (upper.includes('SOLD') || upper.includes('END') || upper.includes('CLOSE')) return 'danger'
  if (upper.includes('DRAFT') || upper.includes('SCHEDUL')) return 'warning'
  return 'default'
}

function bookingVariant(status: string): 'gold' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'CONFIRMED':
      return 'success'
    case 'PENDING':
      return 'gold'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'warning'
  }
}
