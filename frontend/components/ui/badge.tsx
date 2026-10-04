import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-xs border font-mono text-2xs uppercase tracking-[0.14em] transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-white/12 bg-graphite-2 text-ink-soft',
        gold: 'border-gold-400/40 bg-gold-400/12 text-gold-200',
        success: 'border-signal-live/35 bg-signal-live/10 text-signal-live',
        warning: 'border-signal-hold/40 bg-signal-hold/12 text-signal-hold',
        danger: 'border-signal-alert/40 bg-signal-alert/12 text-signal-alert',
        info: 'border-signal-info/35 bg-signal-info/10 text-signal-info',
        outline: 'border-white/12 bg-transparent text-ink-mute',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }