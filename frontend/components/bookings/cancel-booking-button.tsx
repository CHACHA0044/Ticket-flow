'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TriangleAlertIcon } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getClientServices } from '@/lib/api'
import { ApiError } from '@/types/api'

/**
 * Cancellation with explicit confirmation (FR-BOOK-06).
 *
 * Releasing a hold or cancelling a paid booking both destroy inventory, so the
 * action is always confirmed and never fires on a single click. The dialog copy
 * states the consequence plainly — including that a captured payment is not
 * automatically refunded by this call.
 */
export function CancelBookingButton({
  bookingId,
  variant = 'outline',
  size = 'md',
  label = 'Cancel booking',
  className,
}: {
  bookingId: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  label?: string
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => getClientServices().bookings.cancel(bookingId),
    onSuccess: (booking) => {
      setOpen(false)
      toast.success(
        booking.status === 'CANCELLED' ? 'Booking cancelled' : 'Hold released',
        {
          description:
            booking.status === 'CANCELLED'
              ? 'The seats are back in the live pool and no payment was captured.'
              : 'Your seats have been released for other customers to pick.',
        },
      )
      router.refresh()
    },
    onError: (error) => {
      toast.error('Could not cancel this booking', {
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    },
  })

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlertIcon className="size-4 text-signal-hold" aria-hidden />
              {label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The held seats are released immediately and become available to other
              customers. This cannot be undone — you would need to start a new booking
              and re-acquire the hold.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutate()}
              disabled={isPending}
              className="border border-signal-alert/40 bg-signal-alert/15 text-signal-alert hover:bg-signal-alert/25"
            >
              {isPending ? 'Cancelling…' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
