/**
 * Runtime environment access.
 *
 * Every value is read lazily through helpers so the module can be imported from
 * both Server and Client Components, and so a missing variable degrades
 * gracefully instead of throwing at module-evaluation time.
 */

function read(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

function readFlag(name: string): boolean {
  return read(name)?.toLowerCase() === 'true'
}

/** Base URL of the backend REST API. Undefined ⇒ run on mock providers. */
export function getApiUrl(): string | undefined {
  return read('NEXT_PUBLIC_API_URL')
}

/** Base URL for the Socket.io connection. Undefined ⇒ run the local simulator. */
export function getSocketUrl(): string | undefined {
  return read('NEXT_PUBLIC_SOCKET_URL')
}

/** Absolute site origin, used for canonical + Open Graph URLs. */
export function getSiteUrl(): string {
  return read('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000'
}

/** `true` when a real backend is configured. */
export function isRemoteApi(): boolean {
  return getApiUrl() !== undefined
}

/**
 * The in-browser real-time simulator. Automatically disabled as soon as a real
 * Socket.io endpoint is provided, so it can never fight the backend feed.
 */
export function isMockRealtimeEnabled(): boolean {
  if (getSocketUrl()) return false
  if (readFlag('NEXT_PUBLIC_ENABLE_MOCK_REALTIME')) return true
  return process.env.NODE_ENV === 'development'
}