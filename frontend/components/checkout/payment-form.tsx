'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCardIcon, LandmarkIcon, SmartphoneIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/toggle'
import { Checkbox } from '@/components/ui/toggle'
import { formatCardNumber, formatExpiry, checkoutSchema, type CheckoutValues } from '@/lib/validation/checkout'
import { PAYMENT_METHODS, type PaymentMethodKind } from '@/types/booking'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const METHOD_ICON: Record<PaymentMethodKind, typeof CreditCardIcon> = {
  CARD: CreditCardIcon,
  UPI: SmartphoneIcon,
  NETBANKING: LandmarkIcon,
}

/**
 * Payment + billing form.
 *
 * Card fields only render for the card method — validating and asking for a CVV
 * on a UPI payment is the kind of small friction that makes a checkout feel
 * unfinished. React Hook Form owns the values; Zod owns the rules; the submit
 * handler receives data that is already typed as `CheckoutValues`.
 */
export function PaymentForm({
  total,
  pending,
  defaultBilling,
  onSubmit,
}: {
  total: number
  pending: boolean
  defaultBilling: { fullName: string; email: string; phone: string }
  onSubmit: (values: CheckoutValues) => void | Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onBlur',
    defaultValues: {
      paymentMethod: 'CARD',
      billing: {
        fullName: defaultBilling.fullName,
        email: defaultBilling.email,
        phone: defaultBilling.phone,
        cardNumber: '',
        expiry: '',
        cvv: '',
        // Not pre-checked: silently accepting the terms on a customer's behalf is
        // not something a payment screen is entitled to do.
        agreeToTerms: false,
      },
    },
  })

  // Read the method back out of form state rather than mirroring it in local
  // state. A separate `useState` plus a hidden registered input means the visible
  // selection and the submitted value can disagree — and the submitted value is
  // the one that reaches the gateway.
  const method = watch('paymentMethod')

  const selectMethod = (value: string) => {
    setValue('paymentMethod', value as PaymentMethodKind, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const busy = pending || isSubmitting

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <fieldset>
        <legend className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
          Payment method
        </legend>

        <RadioGroup
          value={method}
          onValueChange={selectMethod}
          className="mt-3 grid gap-3 sm:grid-cols-3"
        >
          {PAYMENT_METHODS.map((option) => {
            const Icon = METHOD_ICON[option.kind]
            return (
              <Label
                key={option.kind}
                htmlFor={`method-${option.kind}`}
                className={cn(
                  'cursor-pointer flex-col items-start gap-2 rounded-md border p-4 transition-colors duration-150',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-400/80',
                  method === option.kind
                    ? 'border-gold-400/50 bg-gold-400/10'
                    : 'border-white/10 bg-carbon-2/60 hover:border-white/20',
                )}
              >
                <span className="flex w-full items-center gap-2">
                  <RadioGroupItem id={`method-${option.kind}`} value={option.kind} />
                  <Icon className="size-4 text-ink-mute" aria-hidden />
                  <span className="text-sm text-ink">{option.label}</span>
                </span>
                <span className="text-xs text-ink-faint">{option.description}</span>
              </Label>
            )
          })}
        </RadioGroup>
        {/* Keeps the value in the submitted payload; the visible selection is
            written through `setValue` above, so the two cannot drift. */}
        <input type="hidden" {...register('paymentMethod')} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
          Billing details
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.billing?.fullName?.message}>
            <Input
              autoComplete="name"
              {...register('billing.fullName')}
              aria-invalid={Boolean(errors.billing?.fullName)}
            />
          </Field>

          <Field label="Email" error={errors.billing?.email?.message}>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register('billing.email')}
              aria-invalid={Boolean(errors.billing?.email)}
            />
          </Field>

          <Field label="Mobile number" error={errors.billing?.phone?.message}>
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              {...register('billing.phone')}
              aria-invalid={Boolean(errors.billing?.phone)}
            />
          </Field>
        </div>
      </fieldset>

      {method === 'CARD' && (
        <fieldset className="flex flex-col gap-4">
          <legend className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
            Card details
          </legend>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]">
            <Field label="Card number" error={errors.billing?.cardNumber?.message}>
              <Input
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                {...register('billing.cardNumber', {
                  onChange: (event) => {
                    event.target.value = formatCardNumber(event.target.value)
                  },
                })}
                aria-invalid={Boolean(errors.billing?.cardNumber)}
              />
            </Field>

            <Field label="Expiry" error={errors.billing?.expiry?.message}>
              <Input
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                {...register('billing.expiry', {
                  onChange: (event) => {
                    event.target.value = formatExpiry(event.target.value)
                  },
                })}
                aria-invalid={Boolean(errors.billing?.expiry)}
              />
            </Field>

            <Field label="CVV" error={errors.billing?.cvv?.message}>
              <Input
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                className="[&::-webkit-inner-spin-button]:appearance-none"
                {...register('billing.cvv', {
                  onChange: (event) => {
                    event.target.value = event.target.value.replace(/\D+/g, '').slice(0, 4)
                  },
                })}
                aria-invalid={Boolean(errors.billing?.cvv)}
              />
            </Field>
          </div>

          <p className="text-xs text-ink-faint">
            Test mode. Use <span className="font-mono text-ink-mute">4242 4242 4242 4242</span>{' '}
            with any future expiry and any CVV.
          </p>
        </fieldset>
      )}

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5">
        <Label className="items-start gap-3 text-xs leading-relaxed text-ink-mute">
          <Checkbox
            {...register('billing.agreeToTerms')}
            aria-invalid={Boolean(errors.billing?.agreeToTerms)}
            className="mt-0.5"
          />
          <span>
            I accept the booking terms and understand that entry is subject to the venue
           &rsquo;s conditions, and that holds expire after ten minutes.
          </span>
        </Label>
        {errors.billing?.agreeToTerms && (
          <p role="alert" className="text-xs text-signal-alert">
            {errors.billing.agreeToTerms.message}
          </p>
        )}

        <Button type="submit" variant="primary" size="xl" block disabled={busy}>
          {busy ? 'Processing payment…' : `Pay ${formatCurrency(total)}`}
        </Button>

        <p className="text-center text-xs text-ink-faint">
          Payments are simulated in test mode. No real transaction is created.
        </p>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
    : children

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {child}
      {error && (
        <p role="alert" className="text-xs text-signal-alert">
          {error}
        </p>
      )}
    </div>
  )
}
