import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/services/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // 请求取消等非 ApiError 不重试
        if (!(error instanceof ApiError)) return false
        // 网络(0)/HTTP 5xx 重试一次；4xx 与业务错误不重试
        if (error.status === 0 || error.status >= 500) {
          return failureCount < 1
        }
        return false
      },
      refetchOnWindowFocus: false,
    },
  },
})
