import { describe, it, expect, vi, Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import DashboardPage from '../DashboardPage'
import { useDashboardData } from '../../hooks/useDashboardData'

// Mock the TanStack Query custom hook
vi.mock('../../hooks/useDashboardData', () => ({
  useDashboardData: vi.fn(),
}))

// Mock Recharts ResponsiveContainer to bypass JSDOM width/height calculations
vi.mock('recharts', async () => {
  const original = (await vi.importActual('recharts')) as any
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div className="mock-container">{children}</div>,
  }
})

describe('DashboardPage Component', () => {
  it('renders loading skeleton when loading', () => {
    ;(useDashboardData as Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Loading carbon footprint analytics...')).toBeInTheDocument()
  })

  it('renders error state on query failure', () => {
    ;(useDashboardData as Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument()
  })
})
