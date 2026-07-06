import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminUserInfo,
} from '@/types/api'

/** Admin Auth API */
export const authApi = {
  /** Login with username + password */
  login: (data: AdminLoginRequest) =>
    requestApi<AdminLoginResponse>(
      request.post<ApiResponse<AdminLoginResponse>>('/api/admin/auth/login', data)
    ),

  /** Logout */
  logout: () =>
    requestApi<null>(
      request.post<ApiResponse<null>>('/api/admin/auth/logout')
    ),

  /** Get current admin user info */
  getCurrentAdmin: () =>
    requestApi<AdminUserInfo>(
      request.get<ApiResponse<AdminUserInfo>>('/api/admin/auth/me')
    ),

  /** Get current admin permissions (for button-level access control) */
  getPermissions: () =>
    requestApi<string[]>(
      request.get<ApiResponse<string[]>>('/api/admin/auth/permissions')
    ),
}
