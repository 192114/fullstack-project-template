/**
 * API Response Types - aligned with backend {code, msg, data} structure
 */

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/** Paginated response */
export interface PageResult<T = unknown> {
  records: T[]
  total: number
  size: number
  current: number
}

/** Login request */
export interface PasswordLoginRequest {
  phone: string
  password: string
}

/** Login response */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

/** User info */
export interface UserInfo {
  id: number
  phone: string
  username: string
  nickname: string
  avatar: string | null
  email: string | null
  status: number
  createTime: string
  updateTime: string
}

/** Refresh token request */
export interface RefreshTokenRequest {
  refreshToken: string
}

/** Refresh token response */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}
