import { ApiError, type ApiErrorCode, type RequestOptions } from '@/types/api'

/**
 * Minimal HTTP transport for the REST API.
 *
 * Responsibilities: base-URL resolution, query serialisation, timeouts, JSON
 * handling and normalisation of backend errors into `ApiError`. It knows nothing
 * about events, seats or bookings.
 */

const DEFAULT_TIMEOUT_MS = 12_000

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  429: 'RATE_LIMITED',
}

export interface HttpRequest extends RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const normalisedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const url = `${normalisedBase}${path.startsWith('/') ? path : `/${path}`}`

  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }

  const serialised = params.toString()
  return serialised ? `${url}?${serialised}` : url
}

function parseErrorCode(status: number, payload: unknown): ApiErrorCode {
  if (typeof payload === 'object' && payload !== null && 'code' in payload) {
    const code = (payload as { code?: unknown }).code
    if (typeof code === 'string') return code as ApiErrorCode
  }
  return STATUS_TO_CODE[status] ?? 'UNKNOWN'
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return fallback
}

export function createHttpClient(baseUrl: string) {
  async function request<T>(path: string, options: HttpRequest = {}): Promise<T> {
    const { method = 'GET', body, signal, query, headers } = options

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    if (signal) {
      if (signal.aborted) controller.abort()
      else signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      const response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (response.status === 204) return undefined as T

      const text = await response.text()
      const payload: unknown = text ? safeParse(text) : null

      if (!response.ok) {
        throw new ApiError(
          parseErrorCode(response.status, payload),
          errorMessage(payload, `Request failed with status ${response.status}`),
          response.status,
          payload,
        )
      }

      return payload as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('NETWORK', 'The request timed out. Check your connection.', 408)
      }
      throw new ApiError('NETWORK', 'Unable to reach the Ticket Flow API.', 0, error)
    } finally {
      clearTimeout(timeout)
    }
  }

  return { request }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export type HttpClient = ReturnType<typeof createHttpClient>