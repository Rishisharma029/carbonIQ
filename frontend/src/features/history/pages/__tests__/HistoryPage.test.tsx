import { describe, it, expect, vi, Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import HistoryPage from '../HistoryPage'
import { useHistoryQuery, useDeleteHistoryMutation } from '../../hooks/useHistory'

vi.mock('../../hooks/useHistory', () => ({
  useHistoryQuery: vi.fn(),
  useDeleteHistoryMutation: vi.fn(),
}))

vi.mock('recharts', async () => {
  const original = (await vi.importActual('recharts')) as any
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div className="mock-container">{children}</div>,
  }
})

describe('HistoryPage Component', () => {
  it('renders loading skeleton when loading', () => {
    ;(useHistoryQuery as Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    })
    ;(useDeleteHistoryMutation as Mock).mockReturnValue({
      mutate: vi.fn(),
    })

    render(<HistoryPage />)
    expect(screen.getByText('Calculations History')).toBeInTheDocument()
    expect(screen.getByText('Loading calculations log...')).toBeInTheDocument()
  })

  it('renders table when data is fetched', () => {
    const mockData = [
      {
        id: '1',
        date: '2026-06-15',
        total: 8.4,
        transport: 3.8,
        electricity: 2.1,
        food: 1.6,
        waste: 0.9,
      },
    ]
    ;(useHistoryQuery as Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    })
    ;(useDeleteHistoryMutation as Mock).mockReturnValue({
      mutate: vi.fn(),
    })

    render(<HistoryPage />)
    expect(screen.getByText('2026-06-15')).toBeInTheDocument()
    expect(screen.getByText('8.4 tons CO2e')).toBeInTheDocument()
  })
})
