import type { SeatRealtimeEvent, SeatUpdateEvent } from '@/types/seat'

/**
 * Real-time contract (SRS FR-RT-01 … FR-RT-04).
 *
 * The UI subscribes to a room named `event:<eventId>`. Two implementations exist:
 *   • `SocketIoRealtimeClient` — production path, dynamically imports
 *     `socket.io-client` only when `NEXT_PUBLIC_SOCKET_URL` is configured.
 *   • `MockRealtimeClient`      — local simulator used in development so the
 *     seat map can be demonstrated without a backend.
 *
 * Neither is imported by any component: `getRealtimeClient()` is the only entry
 * point, and a connection is only created while a screen is actually mounted.
 */

export type RealtimeStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface RealtimeSubscription {
  /** Safe unsubscribe function. */
  close: () => void
}

export interface RealtimeClient {
  readonly transport: 'socket.io' | 'mock' | 'none'
  connect(): Promise<void>
  disconnect(): void
  /** FR-RT-02 — join `event:<eventId>`. */
  joinEvent(eventId: string): Promise<void>
  leaveEvent(eventId: string): Promise<void>
  /** FR-RT-03 — minimal `{ eventId, seatId, status, version, timestamp }`. */
  onSeatUpdate(handler: (event: SeatUpdateEvent) => void): RealtimeSubscription
  onBatchUpdate(handler: (event: SeatRealtimeEvent) => void): RealtimeSubscription
  onStatus(handler: (status: RealtimeStatus) => void): RealtimeSubscription
}

/** Room name mandated by FR-RT-02. */
export function eventRoom(eventId: string): string {
  return `event:${eventId}`
}

export const REALTIME_EVENTS = {
  SEAT_UPDATED: 'seat:updated',
  SEAT_LOCKED: 'seat:locked',
  SEAT_RELEASED: 'seat:released',
  SEAT_BOOKED: 'seat:booked',
} as const

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS]