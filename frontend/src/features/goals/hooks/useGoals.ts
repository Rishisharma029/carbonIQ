import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '../services/goalsApi'

export const useGoalsQuery = () => {
  return useQuery({
    queryKey: ['goalsList'],
    queryFn: goalsApi.getGoals,
  })
}

export const useCreateGoalMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalsList'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    },
  })
}

export const useRecommendationsQuery = () => {
  return useQuery({
    queryKey: ['recommendationsList'],
    queryFn: goalsApi.getRecommendations,
  })
}

export const useToggleRecommendationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.toggleRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendationsList'] })
      queryClient.invalidateQueries({ queryKey: ['goalsList'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    },
  })
}
