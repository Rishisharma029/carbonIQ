import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../services/reportsApi'

export const useReportsQuery = () => {
  return useQuery({
    queryKey: ['reportsAnalytics'],
    queryFn: reportsApi.getReportsData,
  })
}
