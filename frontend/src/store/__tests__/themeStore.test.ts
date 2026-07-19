import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../themeStore'

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'system' })
  })

  it('should initialise with system theme', () => {
    const state = useThemeStore.getState()
    expect(state.theme).toBe('system')
  })

  it('should update theme and save to localStorage', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('carboniq-theme')).toBe('dark')
  })
})
