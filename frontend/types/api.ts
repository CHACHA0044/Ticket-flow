/** Shared API envelope types + the structured error every service throws. */

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/** Error codes the UI branches on. 409 is the concurrency-rejection path (FR-CONC-01). */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SEAT_UNAVAILABLE'
  | 'LOCK_EXPIRED'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'QUEUE_REQUIRED'
  | 'NETWORK'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, status = 500, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }

  /** True when the failure is a benign seat race that the UI can recover from. */
  get isSeatConflict(): boolean {
    return this.code === 'SEAT_UNAVAILABLE' || this.code === 'CONFLICT' || this.code === 'LOCK_EXPIRED'
  }
}

export interface RequestOptions {
  signal?: AbortSignal
  /** Overrides the configured API base URL for this call. */
  baseUrl?: string
  headers?: Record<string, string>
  /** Query parameters; `undefined` / empty values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>
}