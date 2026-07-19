import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  applyTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (() => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function'
    ) {
      return (window.localStorage.getItem('carboniq-theme') as Theme) || 'system'
    }
    return 'system'
  })(),
  setTheme: (theme) => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.setItem === 'function'
    ) {
      window.localStorage.setItem('carboniq-theme', theme)
    }
    set({ theme })
    get().applyTheme()
  },
  applyTheme: () => {
    if (typeof window === 'undefined') return
    const { theme } = get()
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  },
}))
