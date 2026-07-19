import { useMutation } from '@tanstack/react-query'
import { authApi } from '../services/authApi'
import { useAuthStore } from '@/store/authStore'

export const useLoginMutation = () => {
  const login = useAuthStore((state) => state.login)
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.token, data.user)
    },
  })
}

export const useRegisterMutation = () => {
  const login = useAuthStore((state) => state.login)
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.token, data.user)
    },
  })
}
