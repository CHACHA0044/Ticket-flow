import { CURRENCY, CURRENCY_LOCALE } from './constants'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
})

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

const preciseCurrencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('en-US')

/** `12,48,000` style amounts in INR. Whole rupees only (no paise noise). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Exact amount, used on invoices / receipts where paise matter. */
export function formatPreciseCurrency(value: number): string {
  return preciseCurrencyFormatter.format(value)
}

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value)
}

export function formatNumber(value: number): string {
  return integerFormatter.format(value)
}

/** `28 Feb 2026` */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** `Sat, 28 Feb` — compact form used inside dense cards. */
export function formatDayMonth(iso: string): string {
  return weekdayFormatter.format(new Date(iso))
}

/** `19:30` */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

/** `Feb 2026` — used for grouping by month. */
export function formatMonth(iso: string): string {
  return monthFormatter.format(new Date(iso))
}

/** Machine-readable value for `<time dateTime>`. */
export function toDateTimeAttr(iso: string): string {
  return new Date(iso).toISOString()
}

/** `mm:ss` for the checkout hold countdown. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/** `just now` / `4m ago` / `3d ago` */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

/** Percentage with a fixed width so columns of numbers stay aligned. */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** `2h 15m` — coarse duration for event length labels. */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}