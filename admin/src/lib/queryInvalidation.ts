import type { QueryClient } from '@tanstack/react-query'
import { router } from '@/app/router'
import { queryKeys } from '@/lib/queryKeys'

export async function invalidateAccess(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.permissions }),
    client.invalidateQueries({ queryKey: queryKeys.menusTree }),
  ])
  await router.invalidate()
}
