import Modal from '@/shared/components/Modal'
import { HistoryEntry } from '@/features/dashboard/types'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Leaf, Zap, Apple, Trash2, Award } from 'lucide-react'
import Button from '@/shared/components/Button'

interface CalculationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  entry: HistoryEntry | null
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444']

export default function CalculationDetailsModal({
  isOpen,
  onClose,
  entry,
}: CalculationDetailsModalProps) {
  if (!entry) return null

  const chartData = [
    { name: 'Transportation', value: entry.transport },
    { name: 'Electricity', value: entry.electricity },
    { name: 'Food', value: entry.food },
    { name: 'Waste', value: entry.waste },
  ].filter((item) => item.value > 0)

  const categories = [
    {
      name: 'Transportation',
      value: entry.transport,
      tip: 'Optimize vehicle trips, use light transit, and reduce flight miles.',
      icon: Leaf,
    },
    {
      name: 'Electricity',
      value: entry.electricity,
      tip: 'Swap to green electricity providers and unplug idle loads.',
      icon: Zap,
    },
    {
      name: 'Food',
      value: entry.food,
      tip: 'Transition meals to plant-based items and purchase seasonal local crops.',
      icon: Apple,
    },
    {
      name: 'Waste',
      value: entry.waste,
      tip: 'Sort packaging containers, reuse materials, and support community recycling.',
      icon: Trash2,
    },
  ]
  const topCategory = [...categories].sort((a, b) => b.value - a.value)[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Calculation Breakdown: ${entry.date}`}>
      <div className="space-y-6">
        {/* Total emissions */}
        <div className="text-center py-4 bg-primary/5 rounded-xl border border-primary/10">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Carbon Value
          </span>
          <div className="text-3xl font-extrabold text-primary mt-1">{entry.total} tons CO2e</div>
        </div>

        {/* Chart + Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Pie chart */}
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    fontSize: '10px',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table values */}
          <div className="space-y-2 text-xs">
            {chartData.map((item, index) => (
              <div
                key={item.name}
                className="flex justify-between items-center py-1.5 border-b border-border/40"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-semibold text-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-muted-foreground">{item.value} tons</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tip panel */}
        <div className="p-4 bg-card border border-border/80 rounded-xl flex gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary h-fit">
            {topCategory ? <topCategory.icon className="w-4 h-4" /> : <Award className="w-4 h-4" />}
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-foreground text-xs">
              Recommendation for {topCategory?.name || 'Category'}
            </h5>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              {topCategory?.tip || 'No action needed.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end border-t border-border/20 pt-4">
          <Button onClick={onClose} variant="outline" size="sm" className="cursor-pointer">
            Close Details
          </Button>
        </div>
      </div>
    </Modal>
  )
}
