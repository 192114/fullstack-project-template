import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'

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
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle unified response format
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    // If code is not 200, treat as business error
    if (data.code !== 200) {
      // Handle specific error codes
      if (data.code === 401) {
        // Token expired or invalid - clear token, cache and redirect to login
        localStorage.removeItem('token')
        queryClient.clear()
        router.navigate({ to: '/login' })
        return Promise.reject(new Error(data.msg || '未登录或登录已过期'))
      }
      return Promise.reject(new Error(data.msg || '请求失败'))
    }
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      queryClient.clear()
      router.navigate({ to: '/login' })
    }
    return Promise.reject(error)
  }
)

export default request

/**
 * Helper to extract data from ApiResponse
 */
export async function requestApi<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}
