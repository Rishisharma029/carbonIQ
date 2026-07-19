import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { router } from './routes'
import { useAuthStore } from '@/store/authStore'

// Initialise the TanStack Query Client with robust defaults and global 401 interception
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        useAuthStore.getState().logout()
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
