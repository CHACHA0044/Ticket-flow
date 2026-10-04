'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS_RING } from '@/lib/styles'

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        FOCUS_RING,
        'peer size-4.5 shrink-0 rounded-xs border border-white/20 bg-carbon-2 transition-colors',
        'data-[state=checked]:border-gold-400 data-[state=checked]:bg-gold-400',
        'data-[state=checked]:text-void disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export const RadioGroup = RadioGroupPrimitive.Root

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        FOCUS_RING,
        'size-4.5 shrink-0 rounded-full border border-white/20 bg-carbon-2 transition-colors',
        'data-[state=checked]:border-gold-400 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-2 rounded-full bg-gold-300" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        FOCUS_RING,
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-white/12 bg-graphite-3 transition-colors duration-150',
        'data-[state=checked]:border-gold-400/60 data-[state=checked]:bg-gold-400/85',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-ink transition-transform duration-150 data-[state=checked]:translate-x-[1.15rem] data-[state=checked]:bg-void" />
    </SwitchPrimitive.Root>
  )
}