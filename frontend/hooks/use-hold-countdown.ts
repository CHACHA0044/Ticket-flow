'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/format'

export interface HoldCountdown {
  /** Whole seconds remaining on the distributed lock lease. */
  secondsLeft: number
  /** True once the lease has elapsed. */
  expired: boolean
  /** mm:ss label. */
  label: string
  /** 0–1, consumed from 1 downwards — drives the thin progress bar. */
  progress: number
}

/**
 * Checkout hold timer (FR-BOOK-02 / FR-BOOK-03).
 *
 * Only a "what time is it now" tick is stored, and the remaining seconds are
 * derived from it. Storing the seconds directly would mean re-deriving — and
 * re-synchronising — on every expiry change; deriving keeps a single source of
 * truth for both the digits and the `expired` flag, so the two can never
 * disagree.
 *
 * The first tick is aligned to the next whole second so the display changes
 * exactly when the clock it mirrors does, and never runs on the server.
 */
export function useHoldCountdown(expiresAt: string | null, totalSeconds: number): HoldCountdown {
  const target = expiresAt ? new Date(expiresAt).getTime() : null

  // Seconds-resolution clock. `tickAt` is only ever advanced by the effect below.
  const [tickAt, setTickAt] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return

    let intervalId: ReturnType<typeof setInterval> | undefined

    const timeoutId = setTimeout(() => {
      setTickAt(Date.now())
      intervalId = setInterval(() => setTickAt(Date.now()), 1000)
    }, 1000 - (Date.now() % 1000))

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [target])

  const secondsLeft = target ? Math.max(0, Math.round((target - tickAt) / 1000)) : 0

  return {
    secondsLeft,
    expired: Boolean(target) && secondsLeft <= 0,
    label: formatCountdown(secondsLeft),
    progress: totalSeconds > 0 ? Math.min(1, secondsLeft / totalSeconds) : 0,
  }
}
