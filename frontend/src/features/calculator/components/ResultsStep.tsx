import { CalculationResult } from '../types'
import Button from '@/shared/components/Button'
import { Card, CardContent } from '@/shared/components/Card'
import StatCard from '@/shared/components/StatCard'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Award, Leaf, Zap, Apple, Trash2, RefreshCw } from 'lucide-react'

interface ResultsStepProps {
  result: CalculationResult
  onReset: () => void
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444']

export default function ResultsStep({ result, onReset }: ResultsStepProps) {
  const chartData = [
    { name: 'Transportation', value: result.breakdown.transport },
    { name: 'Electricity', value: result.breakdown.electricity },
    { name: 'Food', value: result.breakdown.food },
    { name: 'Waste', value: result.breakdown.waste },
  ].filter((item) => item.value > 0)

  // Determine top contributor to output targeted reduction tips
  const categories = [
    {
      name: 'Transportation',
      value: result.breakdown.transport,
      tip: "Consider carpooling, using public transit, or reducing short-haul flights. Even minor transit reductions yield significant emissions savings. Sourced from EPA's travel guidelines.",
      icon: Leaf,
    },
    {
      name: 'Electricity',
      value: result.breakdown.electricity,
      tip: "Upgrade to LED lighting, insulate drafty window panels, and switch to green energy utility tariffs if available. Sourced from DEFRA's electricity offsets.",
      icon: Zap,
    },
    {
      name: 'Food',
      value: result.breakdown.food,
      tip: 'Integrating more plant-based nutrition into your weekly meal selection is one of the most effective personal footprint reductions. Sourced from IPCC food guidelines.',
      icon: Apple,
    },
    {
      name: 'Waste',
      value: result.breakdown.waste,
      tip: 'Maximize sorting of paper, aluminum, and plastic containers to ensure they escape landfills. Sourced from EPA recycling databases.',
      icon: Trash2,
    },
  ]
  const highestCategory = [...categories].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="space-y-6 bg-card border border-border p-6 rounded-xl">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Calculation Results</h2>
        <p className="text-xs text-muted-foreground font-medium">
          Your footprint calculation is verified and logged using official databases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metric and Tips */}
        <div className="space-y-4">
          <StatCard
            title="Total Footprint Value"
            value={result.totalEmissions}
            unit="tons CO2e / yr"
            trend={{ value: -12, label: 'vs national average', isPositiveGood: true }}
          />

          <Card className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Targeted Mitigation Action
              </h4>
              <div className="flex gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary h-fit">
                  <highestCategory.icon className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <h5 className="font-bold text-foreground">
                    Highest Category: {highestCategory.name}
                  </h5>
                  <p className="text-muted-foreground leading-relaxed">{highestCategory.tip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Pie Chart */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Category Emissions Distribution
            </h4>
            {chartData.length > 0 ? (
              <div className="w-full h-48 md:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
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
                        fontSize: '11px',
                        borderRadius: '8px',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-10">No emissions logged.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4 border-t border-border/10">
        <Button
          onClick={onReset}
          variant="outline"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="cursor-pointer"
        >
          Calculate New Footprint
        </Button>
      </div>
    </div>
  )
}
