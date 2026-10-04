import type {
  AdminDashboardData,
  AdminKpi,
  EventOpsRow,
  RecentBookingRow,
  RevenuePoint,
  SeatUtilisationPoint,
  SystemHealth,
} from '@/types/admin'
import { formatCompactNumber, formatCurrency, formatNumber } from '@/lib/format'
import { EVENTS } from './events'
import { createSeededRng } from './random'
import type { Store } from './store'
import { getEventSeats } from './store'
import { seatTotals } from './seats'
import { MOCK_USERS } from './users'

/**
 * Operations telemetry for the admin console.
 *
 * Deterministic given the store contents, so Server Component output and any
 * later client refetch agree. Real values come from `/metrics` and the
 * `bookings` aggregate (FR-ADMIN-01 / FR-ADMIN-03).
 */
export function buildMockAdminDashboard(store: Store): AdminDashboardData {
  const utilisation = buildUtilisation(store)
  const revenue = buildRevenue(store)
  const recentBookings = buildRecentBookings(store)
  const events = buildEventRows(store)

  const totalSold = utilisation.reduce((sum, point) => sum + point.sold, 0)
  const totalSeats = utilisation.reduce((sum, point) => sum + point.total, 0)
  const grossRevenue = utilisation.reduce((sum, point) => sum + point.revenue, 0)
  const occupancy = totalSeats > 0 ? (totalSold / totalSeats) * 100 : 0

  const kpis: AdminKpi[] = [
    {
      id: 'revenue',
      label: 'Gross revenue',
      value: grossRevenue,
      display: formatCurrency(grossRevenue),
      delta: { absolute: grossRevenue * 0.184, percentage: 18.4, direction: 'up' },
      hint: 'Across all live events · 30 days',
    },
    {
      id: 'bookings',
      label: 'Confirmed bookings',
      value: store.bookings.size,
      display: formatNumber(store.bookings.size),
      delta: { absolute: 96, percentage: 12.1, direction: 'up' },
      hint: `${store.locksBySeat.size} seats currently held`,
    },
    {
      id: 'occupancy',
      label: 'Seat utilisation',
      value: occupancy,
      display: `${occupancy.toFixed(1)}%`,
      unit: '%',
      delta: { absolute: 4.2, percentage: 4.2, direction: 'up' },
      hint: `${formatNumber(totalSold)} of ${formatNumber(totalSeats)} seats sold`,
    },
    {
      id: 'concurrency',
      label: 'Double-booking rate',
      value: 0,
      display: '0.00%',
      delta: { absolute: 0, percentage: 0, direction: 'flat' },
      hint: 'NFR-REL-01 target: 0.00% across 4,812 lock acquisitions',
    },
    {
      id: 'events',
      label: 'Active events',
      value: events.length,
      display: formatNumber(events.length),
      delta: { absolute: 2, percentage: 14.3, direction: 'up' },
      hint: 'Sales open on all live listings',
    },
    {
      id: 'throughput',
      label: 'Peak lock RPS',
      value: 1486,
      display: formatCompactNumber(1486),
      unit: 'rps',
      delta: { absolute: 214, percentage: 16.8, direction: 'up' },
      hint: 'k6 flash-crowd run · 1,200 VUs',
    },
  ]

  return {
    kpis,
    utilisation,
    revenue,
    recentBookings,
    events,
    health: buildHealth(store),
    generatedAt: new Date().toISOString(),
  }
}

function buildUtilisation(store: Store): SeatUtilisationPoint[] {
  return EVENTS.filter((event) => event.status !== 'DRAFT').map((event) => {
    const totals = seatTotals(getEventSeats(store, event.id))
    const priceForRevenue = totals.booked > 0 ? averagePrice(event.id, store) : 0
    return {
      eventId: event.id,
      eventTitle: event.title,
      total: totals.total,
      sold: totals.booked,
      held: totals.locked,
      available: totals.available,
      occupancy: totals.total > 0 ? (totals.booked / totals.total) * 100 : 0,
      revenue: Math.round(totals.booked * priceForRevenue * 1.24),
    }
  })
}

function averagePrice(eventId: string, store: Store): number {
  const seats = getEventSeats(store, eventId)
  if (seats.length === 0) return 0
  return seats.reduce((sum, seat) => sum + seat.price, 0) / seats.length
}

function buildRevenue(store: Store): RevenuePoint[] {
  const rng = createSeededRng('admin-revenue')
  const points: RevenuePoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const confirmed = [...store.bookings.values()].filter((booking) => booking.status === 'CONFIRMED')

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * 86_400_000)
    const seed = rng()
    const dayBookings = Math.round(38 + seed * 62)
    const gross = Math.round(dayBookings * (2400 + seed * 3800))
    const refunds = Math.round(gross * (0.01 + rng() * 0.03))

    points.push({
      date: date.toISOString().slice(0, 10),
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      gross,
      refunds,
      net: gross - refunds,
      bookings: dayBookings,
    })
  }

  // Fold the seeded confirmed bookings into today so the series reconciles.
  const last = points[points.length - 1]
  if (last && confirmed.length > 0) {
    last.net += confirmed.reduce((sum, booking) => sum + booking.pricing.total, 0)
    last.gross = last.net + last.refunds
    last.bookings += confirmed.length
  }

  return points
}

function buildRecentBookings(store: Store): RecentBookingRow[] {
  const rng = createSeededRng('admin-recent')
  const customers = [
    'Devika Menon',
    'Farhan Qureshi',
    'Ishaan Kapoor',
    'Meera Iyer',
    'Zoya Ahmed',
    'Advait Nair',
  ]
  const statuses: RecentBookingRow['status'][] = [
    'CONFIRMED',
    'CONFIRMED',
    'CONFIRMED',
    'PENDING',
    'CANCELLED',
    'EXPIRED',
  ]

  const stored: RecentBookingRow[] = [...store.bookings.values()].map((booking) => {
    const user = MOCK_USERS.find((candidate) => candidate.id === booking.userId)
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customer: user?.fullName ?? 'Registered guest',
      eventTitle: booking.eventTitle,
      seatCount: booking.items.length,
      amount: booking.pricing.total,
      status: booking.status,
      createdAt: booking.createdAt,
    }
  })

  const synthetic: RecentBookingRow[] = customers.map((customer, index) => {
    const event = EVENTS[(index * 3) % EVENTS.length]!
    const seatCount = 1 + Math.floor(rng() * 4)
    return {
      id: `bkg-stream-${index}`,
      bookingNumber: `TF-2026-${9100 + index}`,
      customer,
      eventTitle: event.title,
      seatCount,
      amount: Math.round(event.minPrice * seatCount * (1 + rng() * 0.8)),
      status: statuses[index % statuses.length]!,
      createdAt: new Date(Date.now() - (index + 1) * 1_180_000).toISOString(),
    }
  })

  return [...stored, ...synthetic]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 9)
}

function buildEventRows(store: Store): EventOpsRow[] {
  return EVENTS.filter((event) => event.status !== 'DRAFT').map((event) => {
    const totals = seatTotals(getEventSeats(store, event.id))
    return {
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      status: event.status,
      seatsSold: totals.booked,
      seatsTotal: totals.total,
      revenue: Math.round(totals.booked * averagePrice(event.id, store) * 1.24),
      lockContentionRate: Number(((totals.locked / Math.max(1, totals.total)) * 100).toFixed(2)),
    }
  })
}

function buildHealth(store: Store): SystemHealth {
  const rng = createSeededRng('admin-health')
  return {
    apiLatencyP95: Number((28 + rng() * 14).toFixed(1)),
    redisLatencyP95: Number((0.6 + rng() * 0.5).toFixed(2)),
    eventLoopLagMs: Number((3 + rng() * 4).toFixed(1)),
    mongoPoolInUse: Math.round(12 + rng() * 8),
    mongoPoolSize: 100,
    queueDepth: store.locksBySeat.size + Math.round(rng() * 6),
    activeConnections: 1180 + Math.round(rng() * 420),
    instances: 3,
    doubleBookingRate: 0,
  }
}