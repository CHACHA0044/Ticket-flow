import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { ProfilePanel } from '@/components/profile/profile-panel'
import { getServerServices } from '@/lib/api/server'
import { formatCurrency } from '@/lib/format'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your Ticket Flow account details and booking preferences.',
  robots: { index: false, follow: false },
}

/**
 * Account screen (FR-AUTH-03).
 *
 * Seeded on the server from the session so the panel renders correctly on first
 * paint; the client component owns only the interactive preference state.
 */
export default async function ProfilePage() {
  const profile = await getServerServices().users.me()

  if (!profile) redirect(`/login?next=${ROUTES.profile}`)

  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <SectionHeading
          as="h1"
          eyebrow="Account"
          title="Your profile"
          lede="Contact details appear on every ticket and receipt, so keep them current."
        />

        <dl className="mt-6 flex flex-wrap gap-3">
          <Stat label="Total bookings" value={String(profile.stats.totalBookings)} />
          <Stat label="Upcoming" value={String(profile.stats.upcomingBookings)} accent />
          <Stat label="Seats booked" value={String(profile.stats.seatsAttended)} />
          <Stat label="Lifetime spend" value={formatCurrency(profile.stats.totalSpent)} />
        </dl>

        <ProfilePanel defaultPreferences={profile.preferences} />
      </div>
    </PageShell>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-white/8 bg-carbon-2/40 px-4 py-3">
      <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${accent ? 'text-gold-200' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  )
}
