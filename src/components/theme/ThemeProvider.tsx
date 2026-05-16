'use client'

import { useEffect } from 'react'

export const THEME_STORAGE_KEY = 'resume-manager-theme'

export type ThemeMode = 'light' | 'dark'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
    ? 'dark'
    : 'light'
}

export function applyTheme(theme: ThemeMode, persist = true) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  if (persist) {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getStoredTheme(), false)
  }, [])

  return children
}
