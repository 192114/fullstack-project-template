import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { queryClient } from './queryClient'
import { AppToaster } from '@/components/business/AppToaster'
import { initSessionSync } from '@/lib/auth'
import '@/styles/globals.css'

document.title = import.meta.env.VITE_APP_TITLE

const disposeSessionSync = initSessionSync()
if (import.meta.hot) import.meta.hot.dispose(disposeSessionSync)

// React Scan for development performance monitoring
if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: true,
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <AppToaster />
    </QueryClientProvider>
  </StrictMode>,
)
