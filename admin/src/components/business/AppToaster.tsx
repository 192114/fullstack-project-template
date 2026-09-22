import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/lib/theme'
import type { CSSProperties } from 'react'

export function AppToaster() {
  const theme = useTheme()
  return (
    <Toaster
      theme={theme}
      richColors
      position="top-center"
      style={
        {
          '--normal-bg': 'var(--color-popover)',
          '--normal-text': 'var(--color-popover-foreground)',
          '--normal-border': 'var(--color-border)',
          '--border-radius': 'var(--radius-lg)',
        } as CSSProperties
      }
    />
  )
}
