import { api } from '@/services/api'

export interface ReportsData {
  cumulativeSavings: number // tons
  averageCategory: string
  monthlyEmissions: {
    month: string
    transport: number
    electricity: number
    food: number
    waste: number
  }[]
  savingsProgress: {
    month: string
    emissions: number
    target: number
  }[]
}

export const reportsApi = {
  getReportsData: async (): Promise<ReportsData> => {
    try {
      const response = await api.get<any>('/v1/dashboard')
      const dashData = response.data?.data || {}
      const latestCalculations = dashData.latestCalculations || []
      const monthlySummaries = dashData.monthlySummaries || []
      const averages = dashData.averages || {}

      // 1. Calculate cumulative savings (difference between oldest calculation and newest)
      let cumulativeSavings = 0
      if (latestCalculations.length >= 2) {
        const oldest = latestCalculations[latestCalculations.length - 1]
        const newest = latestCalculations[0]
        cumulativeSavings = Math.max(
          0,
          Math.round((oldest.results?.totalEmission - newest.results?.totalEmission) * 100) / 100
        )
      }

      // 2. Identify average highest category
      let averageCategory = 'Electricity'
      const avg = averages || {}
      const transportAvg = avg.transport || 0
      const electricityAvg = avg.electricity || 0
      const foodAvg = avg.food || 0
      const wasteAvg = avg.waste || 0

      const maxAvg = Math.max(transportAvg, electricityAvg, foodAvg, wasteAvg)
      if (maxAvg > 0) {
        if (maxAvg === transportAvg) averageCategory = 'Transportation'
        else if (maxAvg === electricityAvg) averageCategory = 'Electricity'
        else if (maxAvg === foodAvg) averageCategory = 'Food'
        else if (maxAvg === wasteAvg) averageCategory = 'Waste'
      } else if (latestCalculations[0]) {
        const c = latestCalculations[0]
        const tr = c.results?.transportEmission || 0
        const el = c.results?.electricityEmission || 0
        const fo = c.results?.foodEmission || 0
        const wa = c.results?.wasteEmission || 0
        const maxVal = Math.max(tr, el, fo, wa)
        if (maxVal === tr) averageCategory = 'Transportation'
        else if (maxVal === el) averageCategory = 'Electricity'
        else if (maxVal === fo) averageCategory = 'Food'
        else if (maxVal === wa) averageCategory = 'Waste'
      }

      // 3. Map monthly emissions
      let monthlyEmissions: any[] = []
      if (monthlySummaries.length > 0) {
        const sortedSummaries = [...monthlySummaries].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year
          return a.month - b.month
        })
        monthlyEmissions = sortedSummaries.map((s: any) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          return {
            month: `${monthNames[s.month - 1]} ${String(s.year).slice(-2)}`,
            transport: Math.round(s.transport * 100) / 100,
            electricity: Math.round(s.electricity * 100) / 100,
            food: Math.round(s.food * 100) / 100,
            waste: Math.round(s.waste * 100) / 100,
          }
        })
      } else {
        // Map from raw calculations if monthly summaries haven't aggregated yet
        const sortedCalcs = [...latestCalculations].slice(0, 12).reverse()
        monthlyEmissions = sortedCalcs.map((c: any) => {
          const date = new Date(c.createdAt)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          return {
            month: `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`,
            transport: Math.round((c.results?.transportEmission || 0) * 100) / 100,
            electricity: Math.round((c.results?.electricityEmission || 0) * 100) / 100,
            food: Math.round((c.results?.foodEmission || 0) * 100) / 100,
            waste: Math.round((c.results?.wasteEmission || 0) * 100) / 100,
          }
        })
      }

      // 4. Map savings progress
      let savingsProgress: any[] = []
      if (monthlySummaries.length > 0) {
        const sortedSummaries = [...monthlySummaries].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year
          return a.month - b.month
        })
        const firstEmissions = sortedSummaries[0]?.totalEmission || 1.0
        savingsProgress = sortedSummaries.map((s: any, idx: number) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const target = firstEmissions * Math.pow(0.97, idx) // target 3% reduction per month
          return {
            month: `${monthNames[s.month - 1]} ${String(s.year).slice(-2)}`,
            emissions: Math.round(s.totalEmission * 100) / 100,
            target: Math.round(target * 100) / 100,
          }
        })
      } else {
        const sortedCalcs = [...latestCalculations].slice(0, 12).reverse()
        const firstEmissions = sortedCalcs[0]?.results?.totalEmission || 1.0
        savingsProgress = sortedCalcs.map((c: any, idx: number) => {
          const date = new Date(c.createdAt)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const target = firstEmissions * Math.pow(0.97, idx)
          return {
            month: `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`,
            emissions: Math.round((c.results?.totalEmission || 0) * 100) / 100,
            target: Math.round(target * 100) / 100,
          }
        })
      }

      // 5. Default baseline data if completely empty
      if (monthlyEmissions.length === 0) {
        monthlyEmissions = [
          { month: 'No Data', transport: 0, electricity: 0, food: 0, waste: 0 },
        ]
        savingsProgress = [
          { month: 'No Data', emissions: 0, target: 0 },
        ]
      }

      return {
        cumulativeSavings,
        averageCategory,
        monthlyEmissions,
        savingsProgress,
      }
    } catch {
      return {
        cumulativeSavings: 0,
        averageCategory: 'None',
        monthlyEmissions: [],
        savingsProgress: [],
      }
    }
  },
}
