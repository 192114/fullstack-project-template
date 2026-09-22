import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'

const TOKEN_KEY = 'token'

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
  },
}

export function initSessionSync() {
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return
    if (event.key !== null && event.key !== TOKEN_KEY) return
    if (event.key === TOKEN_KEY && event.oldValue === event.newValue) return
    queryClient.clear()
    void router.navigate({ to: '/login', replace: true })
  }
  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}
