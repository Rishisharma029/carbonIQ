import { api } from '@/services/api'
import { HistoryEntry } from '@/features/dashboard/types'

export const historyApi = {
  getHistoryList: async (): Promise<HistoryEntry[]> => {
    try {
      const response = await api.get<any>('/v1/history')
      const calculations = response.data?.data?.calculations || []
      
      return calculations.map((c: any) => ({
        id: c._id,
        date: new Date(c.createdAt).toLocaleDateString('en-CA'),
        total: Math.round(c.results?.totalEmission * 100) / 100,
        transport: Math.round(c.results?.transportEmission * 100) / 100,
        electricity: Math.round(c.results?.electricityEmission * 100) / 100,
        food: Math.round(c.results?.foodEmission * 100) / 100,
        waste: Math.round(c.results?.wasteEmission * 100) / 100,
      }))
    } catch {
      // Fallback
      return []
    }
  },
  deleteCalculation: async (id: string): Promise<{ success: boolean }> => {
    try {
      await api.delete(`/v1/history/${id}`)
      return { success: true }
    } catch {
      return { success: false }
    }
  },
}
