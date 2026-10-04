import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-white/10 bg-graphite-2/70 text-ink-soft',
      gold: 'border-gold-400/30 bg-gold-400/8 text-gold-100',
      danger: 'border-signal-alert/40 bg-signal-alert/10 text-signal-alert',
      warning: 'border-signal-hold/40 bg-signal-hold/10 text-signal-hold',
      success: 'border-signal-live/35 bg-signal-live/10 text-signal-live',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Announced by screen readers when the alert reports live status. */
  role?: 'status' | 'alert'
}

export function Alert({ className, variant, role = 'status', ...props }: AlertProps) {
  return (
    <div role={role} className={cn(alertVariants({ variant }), className)} {...props} />
  )
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-medium text-ink', className)} {...props} />
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-ink-soft', className)} {...props} />
}