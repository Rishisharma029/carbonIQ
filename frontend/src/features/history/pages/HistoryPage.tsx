import { useState } from 'react'
import PageHeader from '@/shared/components/PageHeader'
import Skeleton from '@/shared/components/Skeleton'
import ErrorState from '@/shared/components/ErrorState'
import EmptyState from '@/shared/components/EmptyState'
import Button from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
} from '@/shared/components/Table'
import { useHistoryQuery, useDeleteHistoryMutation } from '../hooks/useHistory'
import CalculationDetailsModal from '../components/CalculationDetailsModal'
import { HistoryEntry } from '@/features/dashboard/types'
import { Search, Eye, Trash2, Calendar } from 'lucide-react'

export default function HistoryPage() {
  const { data: historyData, isLoading, isError, refetch } = useHistoryQuery()
  const deleteMutation = useDeleteHistoryMutation()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detail Modal States
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Filter computations
  const filteredHistory = (historyData || []).filter((item) => {
    const matchesSearch =
      item.date.includes(searchQuery) || item.total.toString().includes(searchQuery)
    const matchesStart = startDate ? item.date >= startDate : true
    const matchesEnd = endDate ? item.date <= endDate : true
    return matchesSearch && matchesStart && matchesEnd
  })

  const handleViewDetails = (item: HistoryEntry) => {
    setSelectedEntry(item)
    setIsDetailsOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calculations History" description="Loading calculations log..." />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load History"
        message="We encountered an error loading your calculations log."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculations History"
        description="Verify past assessments, check detailed parameters, and clean up outdated records."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'History' }]}
      />

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border border-border/60 p-4 rounded-xl">
        <div className="relative">
          <Input
            id="historySearch"
            placeholder="Search by date (YYYY-MM-DD) or co2e..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
        </div>

        <div className="relative">
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="pl-8"
          />
          <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
        </div>

        <div className="relative">
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="pl-8"
          />
          <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
        </div>
      </div>

      {/* History table list */}
      {filteredHistory.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Calculation Date</TableHead>
                <TableHead>Total Footprint</TableHead>
                <TableHead className="hidden md:table-cell">Car (t)</TableHead>
                <TableHead className="hidden md:table-cell">Utility (t)</TableHead>
                <TableHead className="hidden md:table-cell">Diet (t)</TableHead>
                <TableHead className="hidden md:table-cell">Waste (t)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-foreground">{item.date}</TableCell>
                  <TableCell className="font-bold text-primary">{item.total} tons CO2e</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {item.transport} t
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {item.electricity} t
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {item.food} t
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {item.waste} t
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(item)}
                        leftIcon={<Eye className="w-4 h-4" />}
                        className="cursor-pointer"
                      >
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        leftIcon={<Trash2 className="w-4 h-4 text-danger" />}
                        className="text-danger hover:bg-danger/5 cursor-pointer animate-none"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title="No Calculations Found"
          description="Adjust search criteria or log a new footprint calculation."
        />
      )}

      {/* Detail Modal overlay */}
      <CalculationDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        entry={selectedEntry}
      />
    </div>
  )
}
