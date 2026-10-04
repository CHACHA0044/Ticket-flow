'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { FOCUS_RING } from '@/lib/styles'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Metallic gold — reserved for the primary action on a screen. */
        primary:
          'bg-linear-to-b from-gold-200 to-gold-400 text-void shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_22px_-12px_rgba(200,169,81,0.75)] hover:from-gold-100 hover:to-gold-300',
        /** Graphite surface — the default secondary action. */
        secondary:
          'border border-white/10 bg-graphite-2 text-ink hover:border-white/20 hover:bg-graphite-3',
        /** Hairline outline for tertiary actions. */
        outline:
          'border border-white/14 bg-transparent text-ink-soft hover:border-gold-400/50 hover:text-gold-200',
        ghost: 'text-ink-soft hover:bg-white/6 hover:text-ink',
        destructive:
          'border border-signal-alert/40 bg-signal-alert/12 text-signal-alert hover:bg-signal-alert/20',
        /** Text-only navigation action. */
        link: 'text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-[0.95rem] [&_svg]:size-4',
        xl: 'h-14 px-8 text-base [&_svg]:size-5',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-3.5',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, block }), FOCUS_RING, className)}
      {...props}
    />
  )
}

export { buttonVariants }