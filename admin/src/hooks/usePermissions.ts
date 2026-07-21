import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/services/api/auth'

/**
 * Fetch and cache the current admin's permission list.
 * Uses staleTime: Infinity so permissions are only fetched once per session
 * (shared with route beforeLoad prefetch via the same queryKey).
 */
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => authApi.getPermissions(),
    staleTime: Infinity,
  })
}
