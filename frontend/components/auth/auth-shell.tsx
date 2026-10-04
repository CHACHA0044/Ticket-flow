'use client'

import * as React from 'react'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand/logo'
import { ROUTES } from '@/lib/constants'

/**
 * Shared chrome for the sign-in and registration screens.
 *
 * Kept as a layout primitive rather than one polymorphic form component: the two
 * flows need genuinely different field sets and different Zod schemas, and
 * merging them into one form forced the types into an intersection that neither
 * schema actually satisfied.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/*
         The root layout renders a "Skip to content" link targeting `#main`, so this
         column has to be the landmark — otherwise the skip link is a dead target on
         the sign-in and registration routes.
       */}
      <main id="main" className="flex flex-col px-4 py-8 sm:px-8 lg:px-12">
        <Link href={ROUTES.home} className="w-fit rounded-sm" aria-label="Ticket Flow — home">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-2 text-sm text-ink-mute">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>

      <AuthAside />
    </div>
  )
}

/** Form column content: width-constrained stack below the heading. */
export function AuthBody({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex flex-col gap-5">{children}</div>
}

export function AuthSwitch({
  question,
  action,
  href,
}: {
  question: string
  action: string
  href: string
}) {
  return (
    <p className="mt-6 text-center text-sm text-ink-mute">
      {question}{' '}
      <Link
        href={href}
        className="rounded-xs text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
      >
        {action}
      </Link>
    </p>
  )
}

/**
 * Field row with a programmatically linked label and inline error.
 *
 * The single child is cloned to receive the generated `id` and ARIA wiring. That
 * keeps the call sites reading like ordinary markup (`<AuthField>…<Input/></AuthField>`)
 * rather than threading ids by hand through every form.
 */
export function AuthField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}) {
  const id = React.useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': Boolean(error),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}
      {hint && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-signal-alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** Password input with a visibility toggle and live strength readout. */
export function PasswordField({
  autoComplete,
  error,
  label = 'Password',
  hint,
  registration,
  onValueChange,
  showStrength = false,
  score,
}: {
  autoComplete: 'current-password' | 'new-password'
  error?: string
  label?: string
  hint?: string
  /** Spread of a React Hook Form `register()` result. */
  registration?: Record<string, unknown>
  onValueChange?: (value: string) => void
  showStrength?: boolean
  score?: { score: number; label: string }
}) {
  const [visible, setVisible] = React.useState(false)
  const passwordId = React.useId()

  const strengthTone =
    score && score.score >= 4
      ? 'bg-signal-live'
      : score && score.score === 3
        ? 'bg-gold-400'
        : score && score.score === 2
          ? 'bg-signal-hold'
          : score && score.score > 0
            ? 'bg-signal-alert'
            : 'bg-white/10'

  const resolvedHint =
    hint ??
    (label === 'Password' && autoComplete === 'new-password'
      ? 'At least 8 characters, mixing upper case, lower case, numbers or symbols.'
      : undefined)

  const describedBy =
    [error ? `${passwordId}-error` : null, resolvedHint ? `${passwordId}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined

  // Rendered directly rather than through <AuthField>: the input is wrapped in a
  // relative container for the visibility toggle, so the field's clone-the-child
  // id injection would land on the wrapper and break the label association.
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={passwordId}>{label}</Label>

      <div className="relative">
        <Input
          {...registration}
          id={passwordId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-10"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => {
            // Merge RHF's handler with the strength readout rather than
            // replacing it, or the field would stop updating the form state.
            const original = registration?.onChange as
              | ((event: React.ChangeEvent<HTMLInputElement>) => unknown)
              | undefined
            original?.(event)
            onValueChange?.(event.target.value)
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-xs text-ink-faint transition-colors hover:bg-white/8 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80"
        >
          {visible ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
        </button>
      </div>

      {resolvedHint && (
        <p id={`${passwordId}-hint`} className="text-xs text-ink-faint">
          {resolvedHint}
        </p>
      )}
      {error && (
        <p id={`${passwordId}-error`} role="alert" className="text-xs text-signal-alert">
          {error}
        </p>
      )}

      {showStrength && score && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex h-1 flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-full flex-1 rounded-full transition-colors ${
                  step <= score.score ? strengthTone : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span
            aria-live="polite"
            className="shrink-0 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint"
          >
            {score.label}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Seeded accounts — this build has no live identity provider.
 *
 * Mirrors the mock store: any known address is accepted with any password of
 * eight or more characters, so the password column says that rather than
 * inventing a secret that would look like a real credential.
 */
export function DemoCredentials() {
  return (
    <div className="mt-8 rounded-md border border-white/8 bg-carbon-2/50 p-4">
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">Demo access</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-mute">
        Authentication runs against seeded accounts in this build — there is no live
        identity provider. Any password of 8 or more characters is accepted.
      </p>
      <dl className="mt-3 flex flex-col gap-2">
        {[
          { role: 'customer', email: 'pranav.dembla@integral.edu.in' },
          { role: 'admin', email: 'ops.admin@ticketflow.dev' },
        ].map((account) => (
          <div key={account.email} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint sm:w-20">
              {account.role}
            </dt>
            <dd className="font-mono text-xs text-ink-soft">{account.email}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden border-l border-white/8 bg-carbon lg:block">
      <div aria-hidden className="tf-grid absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute -right-32 top-1/3 size-[36rem] rounded-full bg-gold-500/8 blur-[130px]"
      />

      <div className="relative flex h-full flex-col justify-between p-12">
        <blockquote className="max-w-md">
          <p className="text-balance text-2xl font-medium leading-snug tracking-tight text-ink">
            &ldquo;The seat you picked is the seat you get — or we tell you before you
            pay.&rdquo;
          </p>
          <footer className="mt-5 font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
            The Ticket Flow guarantee
          </footer>
        </blockquote>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/8 pt-8">
          {[
            { value: '10 min', label: 'Seat hold' },
            { value: '6', label: 'Seats per order' },
            { value: 'Live', label: 'Availability' },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="text-xl font-semibold tracking-tight text-gold-200">{stat.value}</dd>
              <dt className="mt-1 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
