'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOutIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/toggle'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/components/providers/session-provider'
import { getClientServices } from '@/lib/api'
import { ApiError } from '@/types/api'
import type { BookingPreferences } from '@/types/user'
import { ROUTES } from '@/lib/constants'

const DEFAULT_PREFERENCES: BookingPreferences = {
  holdExpiryAlerts: true,
  liveDropAlerts: true,
  defaultPaymentMethod: 'CARD',
  showPriceBreakdown: true,
}

/**
 * Profile and preferences.
 *
 * Preferences are saved optimistically: the toggle responds immediately because a
 * preference control that waits on a round trip feels broken, and the mutation
 * rolls the value back with a toast if the server disagrees.
 */
export function ProfilePanel({ defaultPreferences }: { defaultPreferences: BookingPreferences }) {
  const { user, setUser, refresh } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [preferences, setPreferences] = React.useState<BookingPreferences>(
    defaultPreferences ?? DEFAULT_PREFERENCES,
  )
  const [editingName, setEditingName] = React.useState(false)
  const [fullName, setFullName] = React.useState(user?.fullName ?? '')

  const { mutate: savePreference, isPending } = useMutation({
    mutationFn: (patch: Partial<BookingPreferences>) =>
      getClientServices().users.updatePreferences(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      const previous = preferences
      setPreferences((current) => ({ ...current, ...patch }))
      return { previous }
    },
    onError: (error, _patch, context) => {
      if (context?.previous) setPreferences(context.previous)
      toast.error('Preference not saved', {
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    },
  })

  const { mutate: signOut, isPending: signingOut } = useMutation({
    mutationFn: () => getClientServices().users.logout(),
    onSuccess: async () => {
      await refresh()
      setUser(null)
      toast.success('Signed out')
      router.push(ROUTES.home)
      router.refresh()
    },
    onError: () => {
      // Even if the server call failed, drop local identity — leaving the UI in a
      // half-signed-out state is worse than an over-eager local logout.
      setUser(null)
      router.push(ROUTES.home)
      router.refresh()
    },
  })

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
      {/* Identity */}
      <aside className="rounded-lg border border-white/8 bg-carbon p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full border border-gold-400/30 bg-gold-400/10 text-sm font-semibold text-gold-200"
          >
            {user?.fullName
              ?.split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('') ?? 'TF'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-mute">{user?.email}</p>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <Badge variant="gold" className="mt-4">
            <ShieldCheckIcon aria-hidden /> Administrator
          </Badge>
        )}

        <dl className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-4 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-faint">Member since</dt>
            <dd className="text-ink-mute">{user ? new Date(user.createdAt).getFullYear() : '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-faint">Mobile</dt>
            <dd className="text-ink-mute">{user?.phone ?? 'Not provided'}</dd>
          </div>
        </dl>

        <Button
          variant="outline"
          size="sm"
          block
          className="mt-5"
          disabled={signingOut}
          onClick={() => signOut()}
        >
          <LogOutIcon aria-hidden />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </aside>

      {/* Settings */}
      <div className="flex flex-col gap-6">
        <section aria-labelledby="profile-details" className="rounded-lg border border-white/8 bg-carbon p-5 sm:p-6">
          <h2 id="profile-details" className="flex items-center gap-2 text-sm font-medium text-ink">
            <UserRoundIcon className="size-4 text-ink-faint" aria-hidden />
            Profile details
          </h2>

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-name">Full name</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="display-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  readOnly={!editingName}
                  className="max-w-xs"
                  autoComplete="name"
                />
                <Button variant={editingName ? 'primary' : 'outline'} size="sm" onClick={() => setEditingName((v) => !v)}>
                  {editingName ? 'Save' : 'Edit'}
                </Button>
              </div>
              <p className="text-xs text-ink-faint">
                {editingName
                  ? 'Name changes are saved locally in this build — profile editing maps to PATCH /api/users/me on the real backend.'
                  : 'Displayed on your tickets and booking receipts.'}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="preferences" className="rounded-lg border border-white/8 bg-carbon p-5 sm:p-6">
          <h2 id="preferences" className="text-sm font-medium text-ink">
            Preferences
          </h2>

          <div className="mt-5 flex flex-col divide-y divide-white/8">
            <PreferenceRow
              label="Seat hold expiry alerts"
              description="Warn me before a held seat is released back to the pool."
              checked={preferences.holdExpiryAlerts}
              disabled={isPending}
              onChange={(checked) => savePreference({ holdExpiryAlerts: checked })}
            />

            <PreferenceRow
              label="Live drop alerts"
              description="Notify me when seats release for events I follow."
              checked={preferences.liveDropAlerts}
              disabled={isPending}
              onChange={(checked) => savePreference({ liveDropAlerts: checked })}
            />

            <div className="flex items-start justify-between gap-6 py-4">
              <div className="min-w-0">
                <label htmlFor="default-payment" className="text-sm text-ink">
                  Default payment method
                </label>
                <p className="mt-1 text-xs leading-relaxed text-ink-mute">
                  Pre-selected at checkout. Test mode — no instrument is stored.
                </p>
              </div>
              <select
                id="default-payment"
                value={preferences.defaultPaymentMethod}
                onChange={(event) => savePreference({ defaultPaymentMethod: event.target.value })}
                disabled={isPending}
                className="h-9 shrink-0 rounded-sm border border-white/12 bg-carbon-2 px-2.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80"
              >
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="NETBANKING">Net banking</option>
              </select>
            </div>

            <PreferenceRow
              label="Detailed price breakdown"
              description="Show fees and taxes per line on checkout."
              checked={preferences.showPriceBreakdown}
              disabled={isPending}
              onChange={(checked) => savePreference({ showPriceBreakdown: checked })}
            />
          </div>

          <Separator className="my-2" />

          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            Preferences are stored against your account and mirrored to
            <code className="mx-1 rounded-xs bg-white/6 px-1 py-0.5 font-mono text-[0.7rem] text-ink-mute">
              PATCH /api/users/me/preferences
            </code>
            on the production backend.
          </p>
        </section>
      </div>
    </div>
  )
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  const id = React.useId()
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-ink-mute">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}
