import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/services/api/auth'
import { queryKeys } from '@/lib/queryKeys'

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: ({ signal }) => authApi.getPermissions(signal),
  })
}
