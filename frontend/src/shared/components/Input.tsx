import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
  leftElement?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      description,
      leftElement,
      rightElement,
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
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
          {leftElement && (
            <div className="absolute left-3 flex items-center justify-center text-muted-foreground pointer-events-none">
              {leftElement}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : descId}
            className={`
              flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/60
              focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 disabled:bg-muted/30
              ${leftElement ? 'pl-10' : ''}
              ${rightElement ? 'pr-10' : ''}
              ${error ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-muted-foreground">
              {rightElement}
            </div>
          )}
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
Input.displayName = 'Input'
