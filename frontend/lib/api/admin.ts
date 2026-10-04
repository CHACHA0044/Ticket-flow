import type { HttpClient } from './client'
import type { AdminDashboardData } from '@/types/admin'
import type { RequestOptions } from '@/types/api'
import type { AdminService } from './contracts'

/** HTTP implementation of the operations console endpoints (FR-ADMIN-01/03). */
export function createAdminService(client: HttpClient): AdminService {
  return {
    async dashboard(options?: RequestOptions) {
      return client.request<AdminDashboardData>('/admin/dashboard', options)
    },
  }
}