import type { HttpClient } from './client'
import type { BookingPreferences, LoginInput, RegisterInput, User, UserProfile } from '@/types/user'
import type { RequestOptions } from '@/types/api'
import type { UserService } from './contracts'

/** HTTP implementation of the identity endpoints (FR-AUTH-01 … FR-AUTH-05). */
export function createUserService(client: HttpClient): UserService {
  return {
    async me(options?: RequestOptions) {
      const result = await client.request<{ user: UserProfile | null }>('/users/me', options)
      return result.user
    },

    async updatePreferences(patch: Partial<BookingPreferences>, options?: RequestOptions) {
      const result = await client.request<{ preferences: BookingPreferences }>('/users/me', {
        method: 'PATCH',
        body: patch,
        ...options,
      })
      return result.preferences
    },

    async login(input: LoginInput, options?: RequestOptions) {
      const result = await client.request<{ user: User }>('/users/login', {
        method: 'POST',
        body: input,
        ...options,
      })
      return result.user
    },

    async register(input: RegisterInput, options?: RequestOptions) {
      const result = await client.request<{ user: User }>('/users/register', {
        method: 'POST',
        body: input,
        ...options,
      })
      return result.user
    },

    async logout(options?: RequestOptions) {
      await client.request<void>('/users/logout', { method: 'POST', ...options })
    },
  }
}