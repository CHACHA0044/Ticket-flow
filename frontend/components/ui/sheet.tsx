'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS_RING } from '@/lib/styles'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

const SIDE_STYLES = {
  right:
    'inset-y-0 right-0 h-dvh w-[min(24rem,88vw)] border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left: 'inset-y-0 left-0 h-dvh w-[min(20rem,86vw)] border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  bottom:
    'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  top: 'inset-x-0 top-0 max-h-[88dvh] rounded-b-xl border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
} as const

export interface SheetContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  side?: keyof typeof SIDE_STYLES
  showClose?: boolean
}

export function SheetContent({
  className,
  children,
  side = 'right',
  showClose = true,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-void/80 backdrop-blur-[2px]',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col overflow-y-auto border-white/10 bg-carbon',
          'shadow-[0_0_120px_-20px_rgba(0,0,0,1)] outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-250 data-[state=closed]:duration-200',
          SIDE_STYLES[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              FOCUS_RING,
              'absolute right-4 top-4 grid size-9 place-items-center rounded-sm text-ink-mute transition-colors hover:bg-white/8 hover:text-ink',
            )}
          >
            <XIcon className="size-4" aria-hidden />
            <span className="sr-only">Close menu</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 border-b border-white/8 p-5 pr-14', className)} {...props} />
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-medium tracking-tight text-ink', className)}
      {...props}
    />
  )
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-ink-mute', className)}
      {...props}
    />
  )
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto border-t border-white/8 p-5', className)} {...props} />
}