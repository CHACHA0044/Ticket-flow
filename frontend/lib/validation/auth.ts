import { z } from 'zod'

/**
 * Auth validation.
 *
 * Strength rules are advisory feedback, not security. Length plus a character
 * class is deliberately modest: an 8-character minimum with three of four
 * classes is the sane NIST-aligned baseline, and anything stricter pushes users
 * toward predictable substitutions.
 */

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional(),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name.')
      .max(80, 'That name is too long.'),
    email: z.email('Enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(128, 'That password is too long.')
      .refine(hasThreeCharacterClasses, 'Mix upper case, lower case, numbers or symbols.'),
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
    // `boolean().refine` rather than `z.literal(true)`: the form's honest initial
    // value is `false`, and coercing that through `as unknown as true` would be
    // a lie the form state carries until the user touches it.
    acceptTerms: z.boolean().refine((accepted) => accepted, {
      message: 'You must accept the terms to continue.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Those passwords do not match.',
    path: ['confirmPassword'],
  })

export type LoginValues = z.input<typeof loginSchema>
export type RegisterValues = z.input<typeof registerSchema>

function hasThreeCharacterClasses(value: string): boolean {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(value),
  ).length
  return classes >= 3
}

/**
 * Presentational password strength.
 *
 * Returns a 0–4 score derived only from entropy-relevant properties, never used
 * to block submission — the user, not a bar, decides.
 */
export function scorePassword(value: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (value.length === 0) return { score: 0, label: 'Empty' }

  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  score += hasThreeCharacterClasses(value) ? 1 : 0
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 10) score += 1

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  const labels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'] as const
  return { score: clamped, label: labels[clamped] }
}
