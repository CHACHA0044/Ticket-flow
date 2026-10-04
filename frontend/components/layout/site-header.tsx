'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { LogOutIcon, MenuIcon, TicketIcon, UserIcon, ShieldIcon } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSession } from '@/components/providers/session-provider'
import { PRIMARY_NAV, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Primary site header.
 *
 * Sticky, translucent, and hairline-bordered so it reads as a fixed piece of
 * instrumentation rather than a floating banner. The nav collapses to a sheet
 * below `md`, and the account control swaps between a menu (signed in) and a
 * single sign-in action (signed out) without changing layout position.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const { user, initials } = useSession()

  const isActive = (href: string) =>
    href === ROUTES.home ? pathname === href : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.home}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80"
          aria-label="Ticket Flow — home"
        >
          <Logo hideWordmarkOnMobile />
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative rounded-sm px-3 py-2 text-sm transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80',
                      active ? 'text-gold-200' : 'text-ink-mute hover:text-ink',
                    )}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-px h-px bg-linear-to-r from-transparent via-gold-300 to-transparent"
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
              <Link href={ROUTES.admin}>
                <ShieldIcon aria-hidden />
                Admin
              </Link>
            </Button>
          )}

          {user ? (
            <AccountMenu initials={initials} fullName={user.fullName} email={user.email} />
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
          )}

          <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
            <Link href={ROUTES.events}>
              <TicketIcon aria-hidden />
              Find seats
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="md:hidden" aria-label="Open menu">
                <MenuIcon aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                  <Logo size={28} />
                </SheetTitle>
              </SheetHeader>

              <nav aria-label="Mobile" className="p-5">
                <ul className="flex flex-col gap-1">
                  {PRIMARY_NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={(event) => {
                          // Radix closes the sheet on navigation; make that explicit
                          // so the transition is not lost behind the exit animation.
                          event.currentTarget.blur()
                        }}
                        className={cn(
                          'block rounded-sm px-3 py-3 text-[0.95rem] transition-colors',
                          isActive(item.href)
                            ? 'bg-gold-400/10 text-gold-200 ring-1 ring-inset ring-gold-400/25'
                            : 'text-ink-soft hover:bg-white/5 hover:text-ink',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}

                  {user?.role === 'ADMIN' && (
                    <li>
                      <Link
                        href={ROUTES.admin}
                        className="block rounded-sm px-3 py-3 text-[0.95rem] text-ink-soft transition-colors hover:bg-white/5 hover:text-ink"
                      >
                        Admin dashboard
                      </Link>
                    </li>
                  )}
                </ul>

                <div className="mt-6 flex flex-col gap-2 border-t border-white/8 pt-5">
                  <Button asChild variant="primary" block>
                    <Link href={ROUTES.events}>Find seats</Link>
                  </Button>
                  {user ? (
                    <Button asChild variant="outline" block>
                      <Link href={ROUTES.profile}>My profile</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" block>
                      <Link href={ROUTES.login}>Sign in</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function AccountMenu({
  initials,
  fullName,
  email,
}: {
  initials: string | null
  fullName: string
  email: string
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const signOut = async () => {
    setPending(true)
    try {
      const { getClientServices } = await import('@/lib/api')
      await getClientServices().users.logout()
    } catch {
      // The cookie is cleared by the server regardless; continue to the home page.
    } finally {
      setPending(false)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          aria-label={`Account menu for ${fullName}`}
        >
          <span
            aria-hidden
            className="grid size-full place-items-center rounded-full bg-gold-400/15 font-mono text-2xs font-semibold text-gold-200"
          >
            {initials ?? <UserIcon className="size-4" />}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case">
          <span className="text-sm font-medium tracking-normal text-ink">{fullName}</span>
          <span className="text-xs font-normal tracking-normal text-ink-mute">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.bookings}>
            <TicketIcon aria-hidden />
            My bookings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.profile}>
            <UserIcon aria-hidden />
            Profile &amp; preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void signOut()
          }}
          disabled={pending}
        >
          <LogOutIcon aria-hidden />
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}