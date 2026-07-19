import { ReactNode } from 'react'
import Button from './Button'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  actionText?: string
  onActionClick?: () => void
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon,
  actionText,
  onActionClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-card/30 ${className}`}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick}>{actionText}</Button>
      )}
    </div>
  )
}
