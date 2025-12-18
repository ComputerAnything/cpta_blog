import React from 'react'
import { Alert } from 'react-bootstrap'

// ============================================================================
// FormAlert - Standardized alert component for forms
// ============================================================================

export interface AlertState {
  type: 'success' | 'danger' | 'warning' | 'info'
  message: string
}

interface FormAlertProps {
  alert: AlertState | null
  onClose?: () => void
  dismissible?: boolean 
}

export const FormAlert: React.FC<FormAlertProps> = ({
  alert,
  onClose,
  dismissible = true
}) => {
  if (!alert) return null

  return (
    <Alert
      variant={alert.type}
      dismissible={dismissible && !!onClose}
      onClose={onClose}
    >
      {alert.message}
    </Alert>
  )
}
