import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Ticket Flow account to book seats and keep every ticket in one place.',
  robots: { index: false, follow: true },
}

/** Registration route. Mirrors `/login` — see that page for layout rationale. */
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy />}>
      <RegisterForm />
    </Suspense>
  )
}
