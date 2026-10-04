'use client'

import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { User } from '@/types/user'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers/session-provider'
import { queryClient } from '@/lib/query/client'

/**
 * Client-side application shell.
 *
 * Four providers, each earning its place:
 *   • `SessionProvider` — mock auth resolved once per tab and shared, so the
 *     header, checkout and bookings never disagree on who is signed in;
 *   • `QueryClientProvider` — React Query owns every server-state cache. The
 *     seat map deliberately does not use it (seat state is a subscription, not
 *     a query), but the catalog, bookings list and admin metrics are cached,
 *     deduplicated and retried here;
 *   • `TooltipProvider` — one shared open-delay, so seat tooltips do not flicker
 *     as the pointer sweeps across the map;
 *   • `Toaster` — global, politely-announced feedback for real state changes.
 */
export function Providers({
  initialUser,
  children,
}: {
  initialUser: User | null
  children: ReactNode
}) {
  return (
    <SessionProvider initialUser={initialUser}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
