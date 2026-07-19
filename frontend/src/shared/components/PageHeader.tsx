import { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; path?: string }[]
  className?: string
}

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/30 mb-6 ${className}`}
    >
      <div className="space-y-1">
        {/* Optional Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 select-none">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span>/</span>}
                <span
                  className={
                    crumb.path ? 'hover:text-foreground cursor-pointer font-semibold' : 'font-normal'
                  }
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* Page Actions */}
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  )
}
