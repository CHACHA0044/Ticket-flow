/** Admin / operations telemetry types (FR-ADMIN-01 … FR-ADMIN-03). */

export interface MetricDelta {
  absolute: number
  percentage: number
  direction: 'up' | 'down' | 'flat'
}

export interface AdminKpi {
  id: string
  label: string
  value: number
  /** Already formatted for display (₹, %, plain). */
  display: string
  unit?: string
  delta: MetricDelta
  hint: string
}

export interface SeatUtilisationPoint {
  eventId: string
  eventTitle: string
  total: number
  sold: number
  held: number
  available: number
  /** 0–100 occupancy of sellable inventory. */
  occupancy: number
  revenue: number
}

export interface RevenuePoint {
  /** ISO date (yyyy-mm-dd). */
  date: string
  label: string
  gross: number
  refunds: number
  net: number
  bookings: number
}

export interface RecentBookingRow {
  id: string
  bookingNumber: string
  customer: string
  eventTitle: string
  seatCount: number
  amount: number
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'EXPIRED'
  createdAt: string
}

export interface EventOpsRow {
  id: string
  title: string
  startTime: string
  status: string
  seatsSold: number
  seatsTotal: number
  revenue: number
  lockContentionRate: number
}

export interface SystemHealth {
  apiLatencyP95: number
  redisLatencyP95: number
  eventLoopLagMs: number
  mongoPoolInUse: number
  mongoPoolSize: number
  queueDepth: number
  activeConnections: number
  instances: number
  /** Derived: 0–100. Requirement NFR-REL-01 must read 0.00%. */
  doubleBookingRate: number
}

export interface AdminDashboardData {
  kpis: AdminKpi[]
  utilisation: SeatUtilisationPoint[]
  revenue: RevenuePoint[]
  recentBookings: RecentBookingRow[]
  events: EventOpsRow[]
  health: SystemHealth
  generatedAt: string
}