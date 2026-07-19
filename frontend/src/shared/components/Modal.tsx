import React, { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
        document.body.style.overflow = 'hidden'
      }
    } else {
      if (dialog.open) {
        dialog.close()
        document.body.style.overflow = 'unset'
      }
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle dialog native Escape cancel event
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault()
    onClose()
  }

  // Handle backdrop clicks (light dismiss)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog) return

    const rect = dialog.getBoundingClientRect()
    const isClickInside =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width

    if (!isClickInside) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={`
        fixed rounded-xl border border-border bg-card p-0 text-foreground shadow-lg max-w-lg w-[calc(100%-2rem)] md:w-full backdrop:bg-slate-900/40 backdrop:backdrop-blur-xs
        open:flex open:flex-col overflow-hidden focus:outline-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        {title ? (
          <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[70vh] flex-1 text-sm text-muted-foreground">
        {children}
      </div>
    </dialog>
  )
}
