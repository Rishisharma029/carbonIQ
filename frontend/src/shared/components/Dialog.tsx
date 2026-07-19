import Modal from './Modal'
import Button from './Button'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isConfirmLoading?: boolean
  variant?: 'primary' | 'danger'
}

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirmLoading = false,
  variant = 'primary',
}: DialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isConfirmLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isConfirmLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
