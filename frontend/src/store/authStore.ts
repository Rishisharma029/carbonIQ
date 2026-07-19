import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: (() => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function'
    ) {
      return window.localStorage.getItem('carboniq-token')
    }
    return null
  })(),
  user: (() => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function'
    ) {
      const stored = window.localStorage.getItem('carboniq-user')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  })(),
  login: (token, user) => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.setItem === 'function'
    ) {
      window.localStorage.setItem('carboniq-token', token)
      window.localStorage.setItem('carboniq-user', JSON.stringify(user))
    }
    set({ token, user })
  },
  logout: () => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.removeItem === 'function'
    ) {
      window.localStorage.removeItem('carboniq-token')
      window.localStorage.removeItem('carboniq-user')
    }
    set({ token: null, user: null })
  },
  isAuthenticated: () => !!get().token,
}))
