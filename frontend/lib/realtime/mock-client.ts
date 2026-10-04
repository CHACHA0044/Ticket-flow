import {
  eventRoom,
  type RealtimeClient,
  type RealtimeStatus,
  type RealtimeSubscription,
} from './types'
import type { SeatUpdateEvent } from '@/types/seat'
import { createSeededRng } from '@/lib/mock/random'

/**
 * Development-time seat activity simulator.
 *
 * Emits the same payloads the Socket.io gateway will emit, so the seat map's
 * subscription logic, conflict handling and status indicators are exercised
 * without a backend. It is only selected when no `NEXT_PUBLIC_SOCKET_URL` is
 * configured, and it never opens a real network connection.
 */

interface SimulatorOptions {
  /** Mean milliseconds between simulated transitions. */
  intervalMs?: number
  /** Probability that a transition is a competing buyer's hold. */
  holdRatio?: number
}

export function createMockRealtimeClient(
  getEventIds: () => string[],
  options: SimulatorOptions = {},
): RealtimeClient {
  const intervalMs = options.intervalMs ?? 4200
  const holdRatio = options.holdRatio ?? 0.68

  const seatHandlers = new Set<(event: SeatUpdateEvent) => void>()
  const statusHandlers = new Set<(status: RealtimeStatus) => void>()
  const joined = new Set<string>()

  let timer: ReturnType<typeof setInterval> | null = null
  let status: RealtimeStatus = 'idle'

  const setStatus = (next: RealtimeStatus) => {
    if (next === status) return
    status = next
    for (const handler of statusHandlers) handler(next)
  }

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const pick = <T>(items: readonly T[], rng: () => number): T | undefined =>
    items[Math.floor(rng() * items.length)]

  /**
   * Produces a plausible transition for an event.
   *
   * Seat ids mirror the `eventId:section:row:number` convention used by the
   * mock dataset, so updates land on real seats in the rendered map.
   */
  const makeEvent = (eventId: string): SeatUpdateEvent => {
    const rng = createSeededRng(`${eventId}:${Date.now()}`)
    const sections = ['VP', 'A', 'B', 'C', 'E', 'N', 'S', 'W', 'GA', 'GB', 'GC']
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q']
    const section = pick(sections, rng) ?? 'B'
    const row = pick(rows, rng) ?? 'B'
    const number = 1 + Math.floor(rng() * 18)
    const isHold = rng() < holdRatio

    return {
      eventId,
      seatId: `${eventId}:${section}:${row}:${number}`,
      status: isHold ? 'LOCKED' : 'BOOKED',
      version: 2,
      expiresAt: isHold ? Date.now() + 240_000 : undefined,
      timestamp: Date.now(),
    }
  }

  const start = () => {
    if (timer) return
    setStatus('live')
    timer = setInterval(() => {
      const eventIds = getEventIds()
      for (const eventId of eventIds) {
        const payload = makeEvent(eventId)
        for (const handler of seatHandlers) handler(payload)
      }
    }, intervalMs)
  }

  return {
    transport: 'mock',

    async connect() {
      if (joined.size === 0) return
      start()
    },

    disconnect() {
      stop()
      setStatus('offline')
    },

    async joinEvent(eventId) {
      joined.add(eventId)
      start()
    },

    async leaveEvent(eventId) {
      joined.delete(eventId)
      if (joined.size === 0) stop()
    },

    onSeatUpdate(handler): RealtimeSubscription {
      seatHandlers.add(handler)
      return { close: () => seatHandlers.delete(handler) }
    },

    onBatchUpdate() {
      return { close: () => undefined }
    },

    onStatus(handler): RealtimeSubscription {
      statusHandlers.add(handler)
      handler(status)
      return { close: () => statusHandlers.delete(handler) }
    },
  }
}

export { eventRoom }