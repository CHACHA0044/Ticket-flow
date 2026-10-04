'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Confirmation dialog.
 *
 * Built on the existing `Dialog` primitives instead of pulling in Radix's
 * separate alert-dialog package: focus trapping, scroll locking and escape
 * handling are identical, and the distinction that actually matters here is the
 * *intent* of the surface, which this naming makes explicit at every call site.
 *
 * Actions are deliberately not given `autoFocus` — for a destructive confirm the
 * safe default must be the one the keyboard lands on.
 */
export function AlertDialog(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />
}

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn('max-w-md', className)}
      onOpenAutoFocus={(event) => event.preventDefault()}
      {...props}
    />
  )
}

export function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <DialogHeader className={className} {...props} />
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <DialogFooter className={className} {...props} />
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={className} {...props} />
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={className} {...props} />
}

/** Secondary action. Closes the dialog without performing anything. */
export function AlertDialogCancel({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-sm border border-white/12 bg-transparent px-4 text-sm font-medium text-ink-soft transition-colors hover:border-white/22 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 disabled:opacity-45',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Destructive/confirming action. Colours are supplied by the caller. */
export function AlertDialogAction({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-white/12 bg-graphite-2 px-4 text-sm font-medium text-ink transition-colors hover:bg-graphite-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 disabled:opacity-45',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
