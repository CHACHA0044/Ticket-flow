import { getSocketUrl } from '@/lib/env'
import {
  eventRoom,
  REALTIME_EVENTS,
  type RealtimeClient,
  type RealtimeStatus,
  type RealtimeSubscription,
} from './types'
import type { SeatUpdateEvent } from '@/types/seat'

/**
 * Socket.io implementation of the real-time contract.
 *
 * `socket.io-client` is loaded with a dynamic import inside `connect()`, so it
 * only ever reaches the browser bundle when a real endpoint is configured. The
 * module is intentionally not listed as a hard dependency of any component.
 */

interface SocketLike {
  connected: boolean
  connect: () => void
  disconnect: () => void
  emit: (event: string, ...args: unknown[]) => void
  on: (event: string, handler: (...args: unknown[]) => void) => void
  off: (event: string, handler?: (...args: unknown[]) => void) => void
  io?: { reconnect: (attempts: number) => void }
}

export function createSocketIoRealtimeClient(baseUrl: string): RealtimeClient {
  let socket: SocketLike | null = null
  let connecting: Promise<void> | null = null
  const statusHandlers = new Set<(status: RealtimeStatus) => void>()
  let status: RealtimeStatus = 'idle'

  const emitStatus = (next: RealtimeStatus) => {
    if (next === status) return
    status = next
    for (const handler of statusHandlers) handler(next)
  }

  async function ensureSocket(): Promise<SocketLike> {
    if (socket?.connected) return socket
    if (connecting) {
      await connecting
      if (socket) return socket
    }

    emitStatus('connecting')
    connecting = (async () => {
      const { io } = await import('socket.io-client')
      const instance = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 6000,
        reconnectionAttempts: 12,
      }) as unknown as SocketLike

      instance.on('connect', () => emitStatus('live'))
      instance.on('disconnect', () => emitStatus('reconnecting'))
      instance.on('reconnect_attempt', () => emitStatus('reconnecting'))
      instance.on('connect_error', () => emitStatus('offline'))

      socket = instance
    })()

    await connecting
    connecting = null
    if (!socket) throw new Error('Socket.io client failed to initialise.')
    return socket
  }

  return {
    transport: 'socket.io',

    async connect() {
      await ensureSocket()
    },

    disconnect() {
      socket?.disconnect()
      socket = null
      emitStatus('offline')
    },

    async joinEvent(eventId) {
      const instance = await ensureSocket()
      instance.emit('join', eventRoom(eventId))
    },

    async leaveEvent(eventId) {
      socket?.emit('leave', eventRoom(eventId))
    },

    onSeatUpdate(handler: (event: SeatUpdateEvent) => void): RealtimeSubscription {
      const names = [
        REALTIME_EVENTS.SEAT_UPDATED,
        REALTIME_EVENTS.SEAT_LOCKED,
        REALTIME_EVENTS.SEAT_RELEASED,
        REALTIME_EVENTS.SEAT_BOOKED,
      ]
      const listener = (payload: unknown) => handler(payload as SeatUpdateEvent)
      for (const name of names) socket?.on(name, listener)

      return {
        close: () => {
          for (const name of names) socket?.off(name, listener)
        },
      }
    },

    onBatchUpdate(handler) {
      const listener = (payload: unknown) => handler(payload as never)
      socket?.on('seat:batch', listener)
      return { close: () => socket?.off('seat:batch', listener) }
    },

    onStatus(handler) {
      statusHandlers.add(handler)
      handler(status)
      return { close: () => statusHandlers.delete(handler) }
    },
  }
}

export function canUseSocketIo(): boolean {
  return getSocketUrl() !== undefined
}