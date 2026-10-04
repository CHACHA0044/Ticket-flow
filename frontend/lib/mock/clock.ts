/** Deterministic clock helpers for the mock dataset. */

const MS_PER_DAY = 86_400_000

export function startOfToday(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

/**
 * Builds an ISO timestamp `offsetDays` from today at a fixed local time.
 * Fixed times keep SSR and CSR renders byte-identical, which avoids hydration
 * mismatches while the dataset stays relative to "now".
 */
export function dayAt(offsetDays: number, hour = 19, minute = 30): string {
  return new Date(startOfToday() + offsetDays * MS_PER_DAY + hour * 3_600_000 + minute * 60_000).toISOString()
}

/** Same as `dayAt` but relative to now, for holds created during a session. */
export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString()
}

export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * MS_PER_DAY).toISOString()
}

export function nowIso(): string {
  return new Date().toISOString()
}