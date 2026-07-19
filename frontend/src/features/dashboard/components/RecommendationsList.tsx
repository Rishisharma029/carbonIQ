import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { Recommendation } from '../types'
import Badge from '@/shared/components/Badge'
import { Award, Leaf, Zap, Apple, Trash2 } from 'lucide-react'

interface RecommendationsListProps {
  recommendations: Recommendation[]
}

const icons = {
  transport: Leaf,
  electricity: Zap,
  food: Apple,
  waste: Trash2,
}

export default function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Award className="w-5 h-5 text-primary" />
          <span>Vetted Actions</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => {
            const Icon = icons[rec.category] || Award

            return (
              <div
                key={rec.id}
                className="flex gap-3 p-3 border border-border/40 bg-card rounded-lg transition-colors hover:bg-muted/10"
              >
                <div className="p-2 bg-primary/10 rounded-lg text-primary h-fit">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-foreground leading-tight truncate">{rec.title}</h5>
                    <Badge
                      variant={
                        rec.difficulty === 'easy'
                          ? 'success'
                          : rec.difficulty === 'medium'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {rec.difficulty}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-normal">{rec.description}</p>
                  <div className="text-[10px] font-semibold text-primary">
                    Potential Savings: -{rec.potentialSaving} tons CO2e / yr
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">No recommendations found.</p>
        )}
      </CardContent>
    </Card>
  )
}
