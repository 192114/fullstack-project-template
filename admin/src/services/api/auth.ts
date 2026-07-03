import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  PasswordLoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserInfo,
} from '@/types/api'

/** Auth API */
export const authApi = {
  /** Login with phone + password */
  loginPassword: (data: PasswordLoginRequest) =>
    requestApi<LoginResponse>(
      request.post<ApiResponse<LoginResponse>>('/api/auth/login/password', data)
    ),

  /** Refresh access token */
  refreshToken: (data: RefreshTokenRequest) =>
    requestApi<RefreshTokenResponse>(
      request.post<ApiResponse<RefreshTokenResponse>>('/api/auth/refresh', data)
    ),

  /** Logout */
  logout: () =>
    requestApi<null>(
      request.post<ApiResponse<null>>('/api/auth/logout')
    ),

  /** Get current user info */
  getCurrentUser: () =>
    requestApi<UserInfo>(
      request.get<ApiResponse<UserInfo>>('/api/auth/me')
    ),
}
