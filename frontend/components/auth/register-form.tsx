'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
import { registerSchema, scorePassword, type RegisterValues } from '@/lib/validation/auth'
import { ROUTES } from '@/lib/constants'
import { ApiError } from '@/types/api'

/** Registration form, with live password strength feedback. */
export function RegisterForm() {
  const router = useRouter()
  const { refresh } = useSession()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [strength, setStrength] = React.useState({ score: 0, label: 'Empty' } as ReturnType<typeof scorePassword>)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null)
    try {
      const { getClientServices } = await import('@/lib/api')
      await getClientServices().users.register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      await refresh()
      router.push(ROUTES.events)
      router.refresh()
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong creating your account. Please try again.',
      )
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for every booking, ticket and seat you pick."
    >
      {serverError && (
        <Alert variant="danger" className="mt-6" role="alert">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthBody>
          <AuthField label="Full name" error={errors.fullName?.message}>
            <Input {...register('fullName')} autoComplete="name" />
          </AuthField>

          <AuthField label="Email" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </AuthField>

          <AuthField
            label="Mobile number"
            error={errors.phone?.message}
            hint="Used for ticket updates on the day."
          >
            <Input
              {...register('phone')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
            />
          </AuthField>

          <PasswordField
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register('password')}
            onValueChange={(value) => setStrength(scorePassword(value))}
            showStrength
            score={strength}
          />

          <PasswordField
            autoComplete="new-password"
            label="Confirm password"
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-mute">
              {/* See login-form.tsx: a wrapping <label> cannot name a Radix checkbox button. */}
              <Checkbox
                {...register('acceptTerms')}
                aria-label="I accept the terms of service and the privacy policy"
                className="mt-0.5"
              />
              <span>
                I accept the terms of service and the privacy policy, including how booking
                data is retained.
              </span>
            </label>
            {errors.acceptTerms && (
              <p role="alert" className="text-xs text-signal-alert">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" block disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
            {!isSubmitting && <ArrowRightIcon aria-hidden />}
          </Button>
        </AuthBody>
      </form>

      <AuthSwitch question="Already have an account?" action="Sign in" href={ROUTES.login} />
      <DemoCredentials />
    </AuthShell>
  )
}
