import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  guestOnly?: boolean
}

export default function AuthGuard({ guestOnly = false }: AuthGuardProps) {
  const token = useAuthStore((state) => state.token)

  if (guestOnly) {
    if (token) {
      return <Navigate to="/dashboard" replace />
    }
  } else {
    if (!token) {
      return <Navigate to="/login" replace />
    }
  }

  return <Outlet />
}
