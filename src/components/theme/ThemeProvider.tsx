'use client'

import { useEffect } from 'react'

export const THEME_STORAGE_KEY = 'paper-crane-theme'

export type ThemeMode = 'light' | 'dark'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light'
    ? 'light'
    : 'dark'
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getStoredTheme())
  }, [])

  return children
}
