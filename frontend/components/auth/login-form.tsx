'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/toggle'
import {
  AuthBody,
  AuthField,
  AuthShell,
  AuthSwitch,
  DemoCredentials,
  PasswordField,
} from '@/components/auth/auth-shell'
import { useSession } from '@/components/providers/session-provider'
import { loginSchema, type LoginValues } from '@/lib/validation/auth'
import { ROUTES } from '@/lib/constants'
import { ApiError } from '@/types/api'

/** Sign-in form. */
export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useSession()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const redirectTo = searchParams.get('next') ?? ROUTES.events

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    try {
      const { getClientServices } = await import('@/lib/api')
      const user = await getClientServices().users.login({
        email: values.email,
        password: values.password,
        remember: values.remember ?? true,
      })

      await refresh()
      router.push(user.role === 'ADMIN' && !searchParams.get('next') ? ROUTES.admin : redirectTo)
      router.refresh()
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong signing you in. Please try again.',
      )
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your bookings and pick up where you left off."
    >
      {serverError && (
        <Alert variant="danger" className="mt-6" role="alert">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthBody>
          <AuthField label="Email" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </AuthField>

          <PasswordField
            autoComplete="current-password"
            error={errors.password?.message}
            registration={register('password')}
          />

          <label className="flex items-center gap-2.5 text-xs text-ink-mute">
            {/*
               Radix renders the checkbox as a <button role="checkbox">, and a
               wrapping <label> does not name a button. Without an explicit label
               the control is announced as an unnamed checkbox, so it is set here
               rather than relying on the wrapper.
             */}
            <Checkbox {...register('remember')} aria-label="Keep me signed in on this device" />
            Keep me signed in on this device
          </label>

          <Button type="submit" variant="primary" size="lg" block disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
            {!isSubmitting && <ArrowRightIcon aria-hidden />}
          </Button>
        </AuthBody>
      </form>

      <AuthSwitch question="New to Ticket Flow?" action="Create an account" href={ROUTES.register} />
      <DemoCredentials />
    </AuthShell>
  )
}
