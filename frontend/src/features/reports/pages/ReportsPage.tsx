import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  Area,
  Line,
  ComposedChart,
} from 'recharts'
import PageHeader from '@/shared/components/PageHeader'
import StatCard from '@/shared/components/StatCard'
import ChartCard from '@/shared/components/ChartCard'
import Skeleton from '@/shared/components/Skeleton'
import ErrorState from '@/shared/components/ErrorState'
import Button from '@/shared/components/Button'
import { useReportsQuery } from '../hooks/useReports'
import { FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react'

export default function ReportsPage() {
  const { data, isLoading, isError, refetch } = useReportsQuery()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = (type: string) => {
    setIsExporting(type)
    setTimeout(() => {
      setIsExporting(null)
      alert(`Successfully generated and downloaded carbon footprint ${type.toUpperCase()} report.`)
    }, 1500)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics & Reports" description="Loading carbon intelligence data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Failed to Load Reports"
        message="An error occurred compiling your carbon footprint analytics."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Analytics & Reports"
        description="Review seasonal trends, stack emissions categories, and track target compliance."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Reports' }]}
        actions={
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => handleExport('csv')}
              isLoading={isExporting === 'csv'}
              className="cursor-pointer font-semibold"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => handleExport('pdf')}
              isLoading={isExporting === 'pdf'}
              className="cursor-pointer font-semibold"
            >
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Cumulative Footprint Savings"
          value={data.cumulativeSavings}
          unit="tons CO2e"
          trend={{ value: -14.2, label: 'savings improvement', isPositiveGood: true }}
        />
        <StatCard
          title="Primary Reduction Sector"
          value={data.averageCategory}
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
          description="Sector with largest emissions decrease"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Emissions Stacked Bar */}
        <ChartCard
          title="Monthly Emissions Stack"
          description="Category distribution split monthly (tons CO2e)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.monthlyEmissions}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit=" t" />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  fontSize: '11px',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="transport" name="Transportation" stackId="emissions" fill="#10b981" />
              <Bar dataKey="electricity" name="Electricity" stackId="emissions" fill="#06b6d4" />
              <Bar dataKey="food" name="Diet" stackId="emissions" fill="#f59e0b" />
              <Bar dataKey="waste" name="Waste" stackId="emissions" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Savings Progress Line */}
        <ChartCard
          title="Target Limit Progress"
          description="Emissions profile mapped against reduction thresholds (tons CO2e)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data.savingsProgress}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit=" t" />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  fontSize: '11px',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              <Area
                type="monotone"
                dataKey="emissions"
                name="Emissions"
                stroke="#10b981"
                fillOpacity={0.1}
                fill="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target Threshold"
                stroke="#ef4444"
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
