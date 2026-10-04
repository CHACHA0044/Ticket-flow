import type { BookingPreferences, User } from '@/types/user'
import { daysFromNow } from './clock'

export const DEMO_USER_ID = 'usr-2300100925'

export const MOCK_USERS: User[] = [
  {
    id: DEMO_USER_ID,
    email: 'pranav.dembla@integral.edu.in',
    fullName: 'Pranav Dembla',
    role: 'CUSTOMER',
    phone: '+91 98765 43210',
    createdAt: daysFromNow(-240),
  },
  {
    id: 'usr-2300101889',
    email: 'sachin.gautam@integral.edu.in',
    fullName: 'Sachin Gautam',
    role: 'CUSTOMER',
    phone: '+91 98765 43211',
    createdAt: daysFromNow(-238),
  },
  {
    id: 'usr-admin-01',
    email: 'ops.admin@ticketflow.dev',
    fullName: 'Kavya Raghunathan',
    role: 'ADMIN',
    phone: '+91 98111 22334',
    createdAt: daysFromNow(-400),
  },
  {
    id: 'usr-admin-02',
    email: 'ops.admin.lead@ticketflow.dev',
    fullName: 'Rohit Balakrishnan',
    role: 'ADMIN',
    phone: '+91 98111 22335',
    createdAt: daysFromNow(-395),
  },
  {
    id: 'usr-demo-buyer',
    email: 'ananya.rao@example.com',
    fullName: 'Ananya Rao',
    role: 'CUSTOMER',
    phone: '+91 90000 11223',
    createdAt: daysFromNow(-90),
  },
]

export const DEFAULT_PREFERENCES: BookingPreferences = {
  holdExpiryAlerts: true,
  liveDropAlerts: true,
  defaultPaymentMethod: 'CARD',
  showPriceBreakdown: true,
}

export const USER_BY_ID = new Map(MOCK_USERS.map((user) => [user.id, user]))