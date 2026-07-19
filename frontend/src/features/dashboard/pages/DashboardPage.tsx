import { Link } from 'react-router'
import { Plus, Leaf, Zap } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  Cell as BarCell,
} from 'recharts'
import PageHeader from '@/shared/components/PageHeader'
import StatCard from '@/shared/components/StatCard'
import ChartCard from '@/shared/components/ChartCard'
import Skeleton from '@/shared/components/Skeleton'
import ErrorState from '@/shared/components/ErrorState'
import Button from '@/shared/components/Button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
} from '@/shared/components/Table'
import { useDashboardData } from '../hooks/useDashboardData'
import GoalsProgress from '../components/GoalsProgress'
import RecommendationsList from '../components/RecommendationsList'

const BAR_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444']

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardData()

  // Loading skeleton layout
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading carbon footprint analytics..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Error boundary state
  if (isError || !data) {
    return (
      <ErrorState
        title="Failed to Load Dashboard"
        message="We couldn't load your dashboard metrics. Please check your connection and try again."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Real-time footprint logs, category breakdowns, and vetting goals."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Dashboard' }]}
        actions={
          <Link to="/calculator">
            <Button leftIcon={<Plus className="w-4 h-4" />} className="shadow-xs">
              Log Calculation
            </Button>
          </Link>
        }
      />

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Footprint"
          value={data.totalEmissions}
          unit="tons CO2e/yr"
          trend={{ value: -8.7, label: 'vs last month', isPositiveGood: true }}
        />
        <StatCard
          title="Monthly Average"
          value={data.monthlyAverage}
          unit="kg CO2e"
          trend={{ value: -5.4, label: 'vs last month', isPositiveGood: true }}
        />
        <StatCard
          title="Top Category"
          value={data.highestCategory}
          icon={
            data.highestCategory === 'Transportation' ? (
              <Leaf className="w-4 h-4 text-primary" />
            ) : (
              <Zap className="w-4 h-4 text-cyan-500" />
            )
          }
          description="Highest emission source"
        />
        <StatCard
          title="Completed Goals"
          value={data.completedGoalsCount}
          description="Target reduction goals met"
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <ChartCard title="Emissions Trend" description="Total annual co2e footprint over time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.emissionsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardCo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit=" kg" />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  fontSize: '11px',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                }}
              />
              <Area
                type="monotone"
                dataKey="co2e"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#dashboardCo2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Breakdown Bar Chart */}
        <ChartCard title="Category Breakdown" description="Emission breakdown by category (tons CO2e)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.categoryDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.categoryDistribution.map((_, idx) => (
                  <BarCell key={`cell-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* History and Goals Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Calculations</h3>
            <Link to="/history" className="text-xs font-bold text-primary hover:underline">
              View History
            </Link>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total (t)</TableHead>
                  <TableHead className="hidden sm:table-cell">Transit (t)</TableHead>
                  <TableHead className="hidden sm:table-cell">Utilities (t)</TableHead>
                  <TableHead className="hidden sm:table-cell">Diet (t)</TableHead>
                  <TableHead className="hidden sm:table-cell">Waste (t)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-foreground">{item.date}</TableCell>
                    <TableCell className="font-bold text-primary">{item.total} t</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.transport} t
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.electricity} t
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.food} t
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.waste} t
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Goals & Actions column */}
        <div className="space-y-6">
          <GoalsProgress goals={data.activeGoals} />
          <RecommendationsList recommendations={data.recommendations} />
        </div>
      </div>
    </div>
  )
}
