import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Ticket Flow to see your bookings, tickets and saved seats.',
  robots: { index: false, follow: true },
}

/**
 * Sign-in route.
 *
 * Deliberately rendered *outside* `<PageShell>`: an authentication screen has no
 * site header, and the split layout gives it room for the product promise without
 * a header competing for attention. `Suspense` is required because `AuthForm`
 * reads `useSearchParams()` to preserve the intended destination.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function AuthFallback() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2" aria-busy>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-sm pt-10">
          <div className="h-7 w-40 animate-pulse rounded-xs bg-white/6" />
          <div className="mt-6 h-7 w-56 animate-pulse rounded-xs bg-white/6" />
          <div className="mt-8 flex flex-col gap-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-sm bg-white/6" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
