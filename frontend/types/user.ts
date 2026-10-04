/** User domain model — mirrors the `users` collection. */

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone: string | null
  createdAt: string
}

export interface UserProfile extends User {
  /** Aggregate counters rendered on the profile + dashboard screens. */
  stats: {
    totalBookings: number
    upcomingBookings: number
    seatsAttended: number
    totalSpent: number
  }
  preferences: BookingPreferences
}

export interface BookingPreferences {
  /** Notify when seats held by the user are about to expire. */
  holdExpiryAlerts: boolean
  /** Push live release alerts for events the user follows. */
  liveDropAlerts: boolean
  /** Default payment instrument for the sandbox checkout. */
  defaultPaymentMethod: string
  /** Compact vs. detailed price breakdown on checkout. */
  showPriceBreakdown: boolean
}

export interface AuthSession {
  user: User
  /** ISO expiry of the access token (FR-AUTH-04). */
  expiresAt: string
}

/** Register payload — validated client-side with Zod before POST. */
export interface RegisterInput {
  fullName: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
  /** Optional: a session without it is non-persistent. Mirrors `loginSchema`. */
  remember?: boolean
}

export interface AdminIdentity {
  id: string
  email: string
  fullName: string
  role: 'ADMIN'
  organisation: string
  lastSignIn: string
}