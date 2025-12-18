import React from 'react'
import { Alert } from 'react-bootstrap'
import styled from 'styled-components'
import { colors } from '../../theme/colors'

interface StyledAlertProps {
  variant: 'success' | 'danger' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
  dismissible?: boolean
  onClose?: () => void
}

const CustomAlert = styled(Alert)<{ $variant: string }>`
  border-radius: 12px;
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'success': return colors.success
      case 'danger': return colors.danger
      case 'warning': return colors.warning
      case 'info': return colors.info
      default: return colors.success
    }
  }};
  background: ${props => {
    switch (props.$variant) {
      case 'success': return 'rgba(40, 167, 69, 0.1)'
      case 'danger': return 'rgba(220, 53, 69, 0.1)'
      case 'warning': return 'rgba(255, 193, 7, 0.1)'
      case 'info': return 'rgba(23, 162, 184, 0.1)'
      default: return 'rgba(40, 167, 69, 0.1)'
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'success': return colors.success
      case 'danger': return '#ff6b6b'
      case 'warning': return colors.warning
      case 'info': return colors.info
      default: return colors.success
    }
  }};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.5;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .alert-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;
  }

  .btn-close {
    filter: ${props => props.$variant === 'warning' ? 'brightness(0.7)' : 'invert(1)'};
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  strong {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }
`

const StyledAlert: React.FC<StyledAlertProps> = ({
  variant,
  children,
  className = '',
  dismissible = false,
  onClose
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <i className="bi bi-check-circle-fill alert-icon"></i>
      case 'danger':
        return <i className="bi bi-exclamation-circle-fill alert-icon"></i>
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill alert-icon"></i>
      case 'info':
        return <i className="bi bi-info-circle-fill alert-icon"></i>
      default:
        return null
    }
  }

  return (
    <CustomAlert
      variant={variant}
      $variant={variant}
      className={className}
      dismissible={dismissible}
      onClose={onClose}
    >
      {getIcon()}
      <div className="alert-content">
        {children}
      </div>
    </CustomAlert>
  )
}

export default StyledAlert
