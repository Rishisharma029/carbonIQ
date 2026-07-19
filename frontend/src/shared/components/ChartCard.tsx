import { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card'
import Skeleton from './Skeleton'
import EmptyState from './EmptyState'

export interface ChartCardProps {
  title: string
  description?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  headerActions?: ReactNode
  children: ReactNode
  className?: string
}

export default function ChartCard({
  title,
  description,
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There is no data to plot a chart right now.',
  headerActions,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </CardHeader>

      <CardContent className="p-6">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-60 w-full" />
          </div>
        )}

        {!isLoading && isEmpty && (
          <div className="flex items-center justify-center min-h-[15rem]">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              className="border-0 bg-transparent p-0 w-full"
            />
          </div>
        )}

        {!isLoading && !isEmpty && (
          <div className="w-full h-[15rem] md:h-[20rem] flex items-center justify-center">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
