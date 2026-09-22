import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'admin-theme'
const THEME_EVENT = 'admin-theme-change'

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== localStorage || (event.key !== THEME_KEY && event.key !== null))
      return
    document.documentElement.classList.toggle('dark', event.newValue === 'dark')
    onChange()
  }
  window.addEventListener(THEME_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(THEME_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.dispatchEvent(new Event(THEME_EVENT))
}
export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme)
}
