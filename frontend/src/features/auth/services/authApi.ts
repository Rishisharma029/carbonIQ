import { api } from '@/services/api'
import { loginSchema } from '../schemas/login.schema'
import { registerSchema } from '../schemas/register.schema'
import { z } from 'zod'

type LoginPayload = z.infer<typeof loginSchema>
type RegisterPayload = z.infer<typeof registerSchema>

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role?: string
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const response = await api.post<any>('/v1/auth/login', payload)
      const { user } = response.data?.data || {}

      return {
        token: 'cookie_auth_session',
        user: {
          id: user.id || user._id,
          name: user.fullName || user.name || user.email,
          email: user.email,
          role: user.role,
        },
      }
    } catch (err: any) {
      // Offline Demo Fallback Mode
      if (payload.email === 'testdash@carboniq.com' && payload.password === 'Password123!') {
        console.warn('Backend offline or CORS blocked. Loading in offline demo mode.')
        return {
          token: 'mock_demo_auth_session',
          user: {
            id: 'usr_demo_123',
            name: 'Demo User',
            email: 'testdash@carboniq.com',
            role: 'user',
          },
        }
      }
      throw new Error(err.response?.data?.message || 'Invalid email or password.')
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    try {
      const mappedPayload = {
        fullName: payload.name,
        email: payload.email,
        password: payload.password,
      }
      const response = await api.post<any>('/v1/auth/register', mappedPayload)
      const { user } = response.data?.data || {}

      return {
        token: 'cookie_auth_session',
        user: {
          id: user.id || user._id,
          name: user.fullName || user.name || user.email,
          email: user.email,
          role: user.role,
        },
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to complete registration.')
    }
  },
}
