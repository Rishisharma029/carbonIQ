import { ReactNode } from 'react'
import { Card, CardContent } from './Card'
import Badge from './Badge'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  description?: string
  trend?: {
    value: number
    label: string
    isPositiveGood?: boolean // true if down trend is good (e.g. for emissions)
  }
  icon?: ReactNode
  className?: string
}

export default function StatCard({
  title,
  value,
  unit,
  description,
  trend,
  icon,
  className = '',
}: StatCardProps) {
  const isTrendDown = trend && trend.value < 0
  const isTrendUp = trend && trend.value > 0
  const absoluteTrendValue = trend ? Math.abs(trend.value) : 0

  let badgeVariant: 'success' | 'danger' | 'secondary' = 'secondary'
  if (trend) {
    // For emissions, decrease (down) is good (isPositiveGood = true)
    const isGood = isTrendDown ? trend.isPositiveGood : !trend.isPositiveGood
    badgeVariant = isGood ? 'success' : 'danger'
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground font-semibold">{unit}</span>}
        </div>

        {/* Trend Indicator */}
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-4 text-xs">
            {trend && (
              <Badge variant={badgeVariant} className="gap-0.5 pl-1 pr-2 py-0.5">
                {isTrendUp && <ArrowUpRight className="w-3 h-3" />}
                {isTrendDown && <ArrowDownRight className="w-3 h-3" />}
                <span>{absoluteTrendValue}%</span>
              </Badge>
            )}
            {trend?.label && <span className="text-muted-foreground">{trend.label}</span>}
            {!trend && description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
