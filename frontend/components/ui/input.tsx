import * as React from 'react'
import { cn } from '@/lib/utils'
import { FOCUS_RING } from '@/lib/styles'

const fieldBase =
  'w-full rounded-sm border border-white/12 bg-carbon-2/80 text-ink placeholder:text-ink-faint transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-signal-alert/70 aria-invalid:ring-1 aria-invalid:ring-signal-alert/40'

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        fieldBase,
        FOCUS_RING,
        'h-11 px-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, FOCUS_RING, 'min-h-24 resize-y px-3 py-2.5 text-sm', className)}
      {...props}
    />
  )
}