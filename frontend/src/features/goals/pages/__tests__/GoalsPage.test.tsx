import { describe, it, expect, vi, Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import GoalsPage from '../GoalsPage'
import {
  useGoalsQuery,
  useCreateGoalMutation,
  useRecommendationsQuery,
  useToggleRecommendationMutation,
} from '../../hooks/useGoals'

vi.mock('../../hooks/useGoals', () => ({
  useGoalsQuery: vi.fn(),
  useCreateGoalMutation: vi.fn(),
  useRecommendationsQuery: vi.fn(),
  useToggleRecommendationMutation: vi.fn(),
}))

describe('GoalsPage Component', () => {
  it('renders loading skeletons when loading', () => {
    ;(useGoalsQuery as Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    })
    ;(useRecommendationsQuery as Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    })

    render(<GoalsPage />)
    expect(screen.getByText('Reduction Goals')).toBeInTheDocument()
  })

  it('renders active goals and recommendations when data is loaded', () => {
    const mockGoals = [
      {
        id: 'g1',
        title: 'Save electricity',
        targetPercentage: 15,
        startValue: 10,
        currentValue: 10,
        targetValue: 8.5,
        deadline: '2026-12-31',
        status: 'active',
      },
    ]
    const mockRecs = [
      {
        id: 'r1',
        title: 'Solar Panels',
        category: 'electricity',
        description: 'Install panels',
        potentialSaving: 1.5,
        difficulty: 'hard',
        implemented: false,
      },
    ]

    ;(useGoalsQuery as Mock).mockReturnValue({
      data: mockGoals,
      isLoading: false,
      isError: false,
    })
    ;(useRecommendationsQuery as Mock).mockReturnValue({
      data: mockRecs,
      isLoading: false,
      isError: false,
    })
    ;(useCreateGoalMutation as Mock).mockReturnValue({
      mutate: vi.fn(),
    })
    ;(useToggleRecommendationMutation as Mock).mockReturnValue({
      mutate: vi.fn(),
    })

    render(<GoalsPage />)
    expect(screen.getByText('Save electricity (15% Reduction)')).toBeInTheDocument()
    expect(screen.getByText('Solar Panels')).toBeInTheDocument()
  })
})
