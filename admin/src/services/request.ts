import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'
import { ApiError } from '@/services/errors'
import { tokenStore } from '@/lib/auth'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 请求发起时的 token 快照，用于 401 竞态判定 */
    tokenSnapshot?: string | null
  }
}

// Create axios instance
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach auth token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get()
    config.tokenSnapshot = token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * 401 会话失效处理：
 * 若请求发出时的 token 与当前 token 不一致（已被新会话替换，如另一标签页重新登录），
 * 仅静默拒绝，不清理新会话的登录态。
 */
function handleUnauthorized(tokenSnapshot: string | null | undefined) {
  if (tokenSnapshot !== tokenStore.get()) return
  tokenStore.clear()
  queryClient.clear()
  router.navigate({ to: '/login' })
}

// Response interceptor - handle unified response format
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    // If code is not 200, treat as business error
    if (data.code !== 200) {
      if (data.code === 401) {
        handleUnauthorized(response.config?.tokenSnapshot)
      }
      return Promise.reject(new ApiError(data.msg || '请求失败', data.code, response.status))
    }
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    // 主动取消的请求原样抛出（非 ApiError），供上层识别
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    const status = error.response?.status ?? 0
    const code = error.response?.data?.code ?? status
    const msg = error.response?.data?.msg || (status === 0 ? '网络连接失败' : `请求失败(${status})`)
    if (status === 401 || code === 401) {
      handleUnauthorized(error.config?.tokenSnapshot)
    }
    return Promise.reject(new ApiError(msg, code, status))
  },
)

export default request

/**
 * Helper to extract data from ApiResponse
 */
export async function requestApi<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}
