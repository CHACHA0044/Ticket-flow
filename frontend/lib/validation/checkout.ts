import { z } from 'zod'

/**
 * Client-side validation schemas.
 *
 * These exist to give immediate, field-level feedback — they are not a security
 * boundary. Every one of these rules is re-applied server-side before the request
 * is trusted, and the backend must own the authoritative check.
 */

export const paymentMethodSchema = z.enum(['CARD', 'UPI', 'NETBANKING'], {
  message: 'Choose how you would like to pay.',
})

/**
 * Billing details, minus anything instrument-specific.
 *
 * Card fields are optional here and validated conditionally below: a UPI or net
 * banking payment has no card number, so a flat schema would either block those
 * methods on an invisible field or force the form to carry fields the user never
 * saw. That is exactly the friction a checkout should not have.
 */
const billingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter the name that should appear on the ticket.')
    .max(80, 'That name is too long.'),
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvv: z.string().optional(),
  agreeToTerms: z.boolean().refine((accepted) => accepted, {
    message: 'You must accept the booking terms.',
  }),
})

export const checkoutSchema = z
  .object({
    paymentMethod: paymentMethodSchema,
    billing: billingSchema,
  })
  .superRefine((values, ctx) => {
    if (values.paymentMethod !== 'CARD') return

    const cardNumber = (values.billing.cardNumber ?? '').replace(/\s+/g, '')

    if (!/^\d{15,16}$/.test(cardNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['billing', 'cardNumber'],
        message: 'Enter a 15 or 16 digit card number.',
      })
    } else if (!luhn(cardNumber)) {
      // Luhn check — catches transposed digits before a gateway round-trip does.
      ctx.addIssue({
        code: 'custom',
        path: ['billing', 'cardNumber'],
        message: 'That card number does not look right.',
      })
    }

    if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(values.billing.expiry?.trim() ?? '')) {
      ctx.addIssue({ code: 'custom', path: ['billing', 'expiry'], message: 'Use MM/YY.' })
    }

    if (!/^\d{3,4}$/.test(values.billing.cvv?.trim() ?? '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['billing', 'cvv'],
        message: 'The security code is 3 or 4 digits.',
      })
    }
  })

export type BillingValues = z.input<typeof billingSchema>
export type CheckoutValues = z.input<typeof checkoutSchema>

function luhn(value: string): boolean {
  let sum = 0
  let double = false

  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }

  return sum % 10 === 0
}

/** Groups a raw digit string into 4-digit blocks for display. */
export function formatCardNumber(value: string): string {
  return value
    .replace(/\D+/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Restricts expiry input to digits and one slash, capped at MM/YY. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D+/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}
