'use client'

import { useMemo } from 'react'
import { isMockRealtimeEnabled, getSocketUrl } from '@/lib/env'
import { createMockRealtimeClient } from './mock-client'
import { createSocketIoRealtimeClient } from './socketio-client'
import type { RealtimeClient } from './types'

/**
 * Chooses the real-time transport.
 *
 * A real Socket.io endpoint always wins. Otherwise — development and demo
 * builds — the local simulator is used so the seat map behaves realistically
 * with no backend. Nothing here opens a connection: construction is inert and
 * the client is only wired up by `useSeatAvailability()` while the seat screen
 * is mounted.
 */
export function useRealtimeClient(getEventIds: () => string[]): RealtimeClient {
  const socketUrl = getSocketUrl()

  return useMemo(() => {
    if (socketUrl) return createSocketIoRealtimeClient(socketUrl)
    if (isMockRealtimeEnabled()) return createMockRealtimeClient(getEventIds)
    return OFFLINE_CLIENT
  }, [socketUrl, getEventIds])
}

/** No-op client used when real-time is disabled entirely. */
const OFFLINE_CLIENT: RealtimeClient = {
  transport: 'none',
  async connect() {},
  disconnect() {},
  async joinEvent() {},
  async leaveEvent() {},
  onSeatUpdate() {
    return { close: () => undefined }
  },
  onBatchUpdate() {
    return { close: () => undefined }
  },
  onStatus(handler) {
    handler('offline')
    return { close: () => undefined }
  },
}