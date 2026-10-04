'use client'

import * as React from 'react'
import type { User } from '@/types/user'

export interface SessionContextValue {
  /** Currently signed-in user, or `null` for a signed-out visitor. */
  user: User | null
  /** The initial two characters, for the account avatar. */
  initials: string | null
  setUser: (user: User | null) => void
  refresh: () => Promise<void>
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

/**
 * Shared session state.
 *
 * Seeded from the root Server Component so the header is correct on first paint
 * with no client fetch and no hydration mismatch. `refresh()` exists for the two
 * moments where identity changes without a full navigation — logging in, and
 * logging out from the account menu.
 */
export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: User | null
  children: React.ReactNode
}) {
  const [user, setUser] = React.useState<User | null>(initialUser)

  const refresh = React.useCallback(async () => {
    const { getClientServices } = await import('@/lib/api')
    try {
      const profile = await getClientServices().users.me()
      setUser(profile ? { ...profile } : null)
    } catch {
      // A failed refresh must never blank the UI — keep the last known identity.
    }
  }, [])

  const value = React.useMemo<SessionContextValue>(
    () => ({
      user,
      initials: user ? initialsFor(user.fullName) : null,
      setUser,
      refresh,
    }),
    [user, refresh],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside <SessionProvider>.')
  return context
}

function initialsFor(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}