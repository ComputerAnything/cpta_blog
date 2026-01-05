import React, { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton, ColorButton } from '../../../common/StyledButton'
import { colors } from '../../../../theme/colors'

interface SessionWarningModalProps {
  show: boolean
  remainingSeconds: number
  onExtendSession: () => Promise<void>
  onLogout: () => void
  onHide: () => void
}

const CountdownText = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${colors.warning};
  text-align: center;
  margin: 1.5rem 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
`

const WarningText = styled.div`
  text-align: center;
  color: ${colors.text.secondary};
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`

const ButtonContainer = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  show,
  remainingSeconds,
  onExtendSession,
  onLogout,
  onHide
}) => {
  const [extending, setExtending] = useState(false)
  const [countdown, setCountdown] = useState(remainingSeconds)

  // Update countdown from prop
  useEffect(() => {
    setCountdown(remainingSeconds)
  }, [remainingSeconds])

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleExtendSession = async () => {
    setExtending(true)
    try {
      await onExtendSession()
      onHide() // Close modal on success
    } catch {
      // Error handling is done in parent component
    } finally {
      setExtending(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    onHide()
  }

  return (
    <StyledModal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>
          <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: colors.warning }}></i>
          Session Expiring Soon
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WarningText>
          Your session will expire due to inactivity. You'll be automatically logged out in:
        </WarningText>

        <CountdownText>
          {formatTime(countdown)}
        </CountdownText>

        <WarningText>
          Click <strong>"Stay Logged In"</strong> to continue your session, or <strong>"Log Out"</strong> to end it now.
        </WarningText>

        <ButtonContainer>
          <PrimaryButton
            onClick={handleExtendSession}
            disabled={extending}
            className="sheen-hover"
          >
            {extending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Extending Session...
              </>
            ) : (
              <>
                <i className="bi bi-clock-history me-2"></i>
                Stay Logged In
              </>
            )}
          </PrimaryButton>
          <ColorButton
            color="danger"
            onClick={handleLogout}
            disabled={extending}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Log Out Now
          </ColorButton>
        </ButtonContainer>
      </Modal.Body>
    </StyledModal>
  )
}

export default SessionWarningModal
