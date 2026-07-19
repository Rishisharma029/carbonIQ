import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { historyApi } from '../services/historyApi'

export const useHistoryQuery = () => {
  return useQuery({
    queryKey: ['calculationsHistory'],
    queryFn: historyApi.getHistoryList,
  })
}

export const useDeleteHistoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: historyApi.deleteCalculation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculationsHistory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    },
  })
}
