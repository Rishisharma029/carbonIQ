import { ReactNode, useState } from 'react'

export interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({
  content,
  children,
  className = '',
  position = 'top',
}: TooltipProps) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-card border-x-transparent border-b-transparent -mt-[1px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-card border-x-transparent border-t-transparent -mb-[1px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-card border-y-transparent border-r-transparent -ml-[1px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-card border-y-transparent border-l-transparent -mr-[1px]',
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-md shadow-xs whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          {content}
          <div className={`absolute border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  )
}
