import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('should initialise with null token and user', () => {
    const { token, user, isAuthenticated } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('should log in and save credentials', () => {
    const { login } = useAuthStore.getState()
    const mockUser = { id: 'usr_1', name: 'John Doe', email: 'john@example.com' }
    login('token_abc_123', mockUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('token_abc_123')
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated()).toBe(true)
  })

  it('should log out and clear credentials', () => {
    const { login, logout } = useAuthStore.getState()
    const mockUser = { id: 'usr_1', name: 'John Doe', email: 'john@example.com' }

    login('token_abc_123', mockUser)
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)

    logout()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated()).toBe(false)
  })
})
