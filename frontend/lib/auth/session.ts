import 'server-only'
import { cookies } from 'next/headers'
import { getStore, userExists } from '@/lib/mock/store'
import { DEMO_USER_ID } from '@/lib/mock/users'
import type { AuthSession, User } from '@/types/user'

/**
 * Development session handling.
 *
 * The real deployment delegates to the Express backend: JWT access token plus
 * HTTP-only refresh cookie (FR-AUTH-02 / FR-AUTH-04). Until that exists, a
 * single opaque cookie identifies the signed-in user in the mock store, and
 * unauthenticated visitors fall back to the demo account so every screen can be
 * reviewed without signing in first.
 */

export const SESSION_COOKIE = 'tf_uid'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export async function getSessionUserId(): Promise<string> {
  const cookieStore = await cookies()
  const value = cookieStore.get(SESSION_COOKIE)?.value
  if (value && userExists(getStore(), value)) return value
  return DEMO_USER_ID
}

export async function getCurrentUser(): Promise<User | null> {
  const store = getStore()
  const userId = await getSessionUserId()
  return store.users.get(userId) ?? null
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return { user, expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString() }
}

export async function createSession(userId: string, remember: boolean): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: remember ? SESSION_MAX_AGE_SECONDS : undefined,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}