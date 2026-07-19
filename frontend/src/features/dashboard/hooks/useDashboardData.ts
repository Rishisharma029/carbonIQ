import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/dashboardApi'

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: dashboardApi.getDashboardData,
    staleTime: 60_000,      // 1 minute — avoid hammering the API on every mount
    retry: 1,               // retry once on failure (e.g., network blip)
    retryDelay: 1000,
  })
}
