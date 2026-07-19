import { ReactNode } from 'react'

export interface SectionHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export default function SectionHeader({
  title,
  description,
  actions,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/30 ${className}`}
    >
      <div className="space-y-0.5">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
