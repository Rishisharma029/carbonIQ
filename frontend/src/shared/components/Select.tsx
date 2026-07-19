import { SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  description?: string
  options?: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, description, options = [], id, children, ...props }, ref) => {
    const errorId = error ? `${id}-error` : undefined
    const descId = description ? `${id}-desc` : undefined

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-foreground select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={id}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : descId}
            className={`
              flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-all duration-150 cursor-pointer
              focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 disabled:bg-muted/30
              ${error ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}
              ${className}
            `}
            {...props}
          >
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>
        {description && !error && (
          <p id={descId} className="text-xs text-muted-foreground/80">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
