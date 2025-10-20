import React, { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`

const ToastContainer = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  top: 100px;
  right: 20px;
  background: rgba(20, 20, 20, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 193, 7, 0.5);
  border-left: 4px solid #ffc107;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: ${props => props.$isClosing ? slideOut : slideIn} 0.3s ease-out;

  @media (max-width: 576px) {
    right: 10px;
    left: 10px;
    min-width: auto;
  }
`

const ToastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const ToastTitle = styled.h4`
  color: #ffc107;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ToastMessage = styled.p`
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  &:hover {
    color: white;
  }
`

interface ToastProps {
  message: string
  title?: string
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, title = 'Guest Mode', duration = 4000, onClose }) => {
  const [isClosing, setIsClosing] = React.useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  return (
    <ToastContainer $isClosing={isClosing}>
      <ToastHeader>
        <ToastTitle>
          <span>⚠️</span>
          {title}
        </ToastTitle>
        <CloseButton onClick={handleClose}>×</CloseButton>
      </ToastHeader>
      <ToastMessage>{message}</ToastMessage>
    </ToastContainer>
  )
}

export default Toast
