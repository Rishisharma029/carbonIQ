import { AlertCircle } from 'lucide-react'
import Button from './Button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
  className?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try again',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-red-500/10 rounded-xl bg-red-500/5 ${className}`}
    >
      <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{title}</h3>
      <p className="text-sm text-red-600/90 dark:text-red-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/5"
        >
          {retryText}
        </Button>
      )}
    </div>
  )
}
