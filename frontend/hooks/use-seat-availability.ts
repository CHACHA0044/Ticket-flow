'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { buildSeatMapLayout, type SeatMapLayout } from '@/lib/seats/layout'
import { useRealtimeClient } from '@/lib/realtime'
import type { RealtimeStatus } from '@/lib/realtime/types'
import { MAX_SEATS_PER_BOOKING } from '@/lib/constants'
import type { Seat, SeatAvailabilitySnapshot, SeatStatus, SeatUpdateEvent } from '@/types/seat'
import type { Venue } from '@/types/event'

/**
 * Seat availability state model.
 *
 * This is the single place seat state lives. It is deliberately transport
 * agnostic:
 *   • the initial snapshot comes from Server Components over REST, so the map is
 *     painted with no client-side waterfall;
 *   • subsequent transitions arrive through the `RealtimeClient` contract
 *     (`seat:locked` / `seat:released` / `seat:booked` / `seat:updated`);
 *   • optimistic local selections are layered on top and reconciled against
 *     incoming events, which is exactly what a `409 Conflict` looks like to the
 *     customer (FR-CONC-01).
 *
 * No component knows whether the data came from the mock store or Socket.io.
 */

type SeatOverrides = Record<string, Pick<Seat, 'status' | 'version'> & { lockExpiresAt?: number }>

export interface SeatSelectionState {
  /** Effective seat state = snapshot ⊕ realtime overrides. */
  seats: Seat[]
  seatById: Map<string, Seat>
  layout: SeatMapLayout
  selectedIds: string[]
  selectedSeats: Seat[]
  isSelected: (seatId: string) => boolean
  statusOf: (seatId: string) => SeatStatus
  toggleSeat: (seat: Seat) => void
  selectSeat: (seat: Seat) => void
  deselectSeat: (seatId: string) => void
  clearSelection: () => void
  totals: SeatMapLayout['totals']
  /** Seats that just changed status in front of the user (for a brief flash). */
  recentlyUpdated: Set<string>
  realtimeStatus: RealtimeStatus
  transport: 'socket.io' | 'mock' | 'none'
  lastEventAt: number | null
}

export interface UseSeatAvailabilityOptions {
  eventId: string
  venue: Venue
  initial: SeatAvailabilitySnapshot
  maxSeats?: number
  /** Disables the subscription (used by previews / read-only maps). */
  enabled?: boolean
}

export function useSeatAvailability({
  eventId,
  venue,
  initial,
  maxSeats = MAX_SEATS_PER_BOOKING,
  enabled = true,
}: UseSeatAvailabilityOptions): SeatSelectionState {
  const [overrides, setOverrides] = useState<SeatOverrides>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle')
  const [lastEventAt, setLastEventAt] = useState<number | null>(null)
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set())

  // The simulator needs a stable callback that reads the current event id.
  // Writing the ref in an effect rather than during render keeps the render
  // pass pure; the subscription effect below re-runs on `eventId` anyway, so the
  // ref is always current before any event can arrive.
  const eventIdRef = useRef(eventId)
  useEffect(() => {
    eventIdRef.current = eventId
  }, [eventId])
  const getEventIds = useCallback(() => [eventIdRef.current], [])
  const realtime = useRealtimeClient(getEventIds)

  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timers = flashTimers.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const flash = useCallback((seatId: string) => {
    setRecentlyUpdated((previous) => {
      const next = new Set(previous)
      next.add(seatId)
      return next
    })

    const existing = flashTimers.current.get(seatId)
    if (existing) clearTimeout(existing)

    flashTimers.current.set(
      seatId,
      setTimeout(() => {
        setRecentlyUpdated((previous) => {
          if (!previous.has(seatId)) return previous
          const next = new Set(previous)
          next.delete(seatId)
          return next
        })
        flashTimers.current.delete(seatId)
      }, 1400),
    )
  }, [])

  /** Applies one real-time transition, dropping stale OCC versions. */
  const applyUpdate = useCallback(
    (update: SeatUpdateEvent) => {
      if (update.eventId !== eventIdRef.current) return

      setLastEventAt(update.timestamp ?? Date.now())
      flash(update.seatId)

      setOverrides((previous) => {
        const currentVersion = previous[update.seatId]?.version ?? 0
        if (update.version && update.version < currentVersion) return previous
        if (update.version && update.version === currentVersion) return previous

        return {
          ...previous,
          [update.seatId]: {
            status: update.status,
            version: update.version || currentVersion + 1,
            ...(update.expiresAt ? { lockExpiresAt: update.expiresAt } : {}),
          },
        }
      })

      // FR-CONC-01 — a seat the customer had chosen was taken by someone else.
      setSelectedIds((previous) => {
        if (!previous.includes(update.seatId)) return previous
        if (update.status === 'LOCKED' || update.status === 'BOOKED') {
          // Filter by id, not by position: dropping `previous[0]` would silently
          // discard a *different* seat whenever the conflict was not the first
          // selection, leaving the customer holding a seat they cannot pay for.
          const rest = previous.filter((seatId) => seatId !== update.seatId)
          queueMicrotask(() =>
            toast.error('Seat just taken', {
              description: 'Another buyer locked that seat first. Pick a different one.',
            }),
          )
          return rest
        }
        return previous
      })
    },
    [flash],
  )

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    const subscriptions: { close: () => void }[] = []

    const wire = async () => {
      const statusSub = realtime.onStatus(setRealtimeStatus)
      subscriptions.push(statusSub)

      const seatSub = realtime.onSeatUpdate(applyUpdate)
      subscriptions.push(seatSub)

      const batchSub = realtime.onBatchUpdate((payload) => {
        if (Array.isArray(payload)) payload.forEach(applyUpdate)
      })
      subscriptions.push(batchSub)

      await realtime.connect()
      if (disposed) return
      await realtime.joinEvent(eventId)
    }

    void wire()

    return () => {
      disposed = true
      for (const subscription of subscriptions) subscription.close()
      void realtime.leaveEvent(eventId)
      realtime.disconnect()
    }
  }, [enabled, eventId, realtime, applyUpdate])

  // Clear local selections when the event id changes (navigation between events).
  // Adjust-during-render rather than an effect: the previous event's overrides
  // belong to a different seat map and must not be rendered even for one frame.
  const [lastEventId, setLastEventId] = useState(eventId)
  if (lastEventId !== eventId) {
    setLastEventId(eventId)
    setOverrides({})
    setSelectedIds([])
    setLastEventAt(null)
    setRecentlyUpdated(new Set())
  }

  const seats = useMemo(
    () => initial.seats.map((seat) => {
      const override = overrides[seat.id]
      return override ? { ...seat, ...override } : seat
    }),
    [initial.seats, overrides],
  )

  const seatById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats])

  const layout = useMemo(() => buildSeatMapLayout(venue, seats), [venue, seats])

  const selectedSeats = useMemo(
    () => selectedIds.map((id) => seatById.get(id)).filter((seat): seat is Seat => Boolean(seat)),
    [selectedIds, seatById],
  )

  const statusOf = useCallback(
    (seatId: string): SeatStatus => seatById.get(seatId)?.status ?? 'BLOCKED',
    [seatById],
  )

  const isSelected = useCallback((seatId: string) => selectedIds.includes(seatId), [selectedIds])

  const selectSeat = useCallback(
    (seat: Seat) => {
      setSelectedIds((previous) => {
        if (previous.includes(seat.id)) return previous
        if (previous.length >= maxSeats) {
          queueMicrotask(() =>
            toast.warning('Seat limit reached', {
              description: `A maximum of ${maxSeats} seats can be booked per transaction.`,
            }),
          )
          return previous
        }
        return [...previous, seat.id]
      })
    },
    [maxSeats],
  )

  const deselectSeat = useCallback((seatId: string) => {
    setSelectedIds((previous) => previous.filter((id) => id !== seatId))
  }, [])

  const toggleSeat = useCallback(
    (seat: Seat) => {
      setSelectedIds((previous) =>
        previous.includes(seat.id) ? previous.filter((id) => id !== seat.id) : [...previous, seat.id],
      )
    },
    [],
  )

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  return {
    seats,
    seatById,
    layout,
    selectedIds,
    selectedSeats,
    isSelected,
    statusOf,
    toggleSeat,
    selectSeat,
    deselectSeat,
    clearSelection,
    totals: layout.totals,
    recentlyUpdated,
    realtimeStatus,
    transport: realtime.transport,
    lastEventAt,
  }
}