import { useState } from 'react'
import { Modal, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import logger from '../../../../utils/logger'
import { getErrorMessage } from '../../../../utils/errors'
import StyledAlert from '../../../common/StyledAlert'
import PasswordStrengthMeter from '../../../common/PasswordStrengthMeter'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import { PasswordInput } from '../../../common/PasswordInput'
import { colors } from '../../../../theme/colors'

interface ChangePasswordModalProps {
  show: boolean
  onHide: () => void
}

const StyledModalExtended = styled(StyledModal)`
  .password-requirements {
    color: ${colors.text.muted};
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
`

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ show, onHide }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    // Check that new password is different
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      await authAPI.changePassword(currentPassword, newPassword)
      setSuccess(true)

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to login after 2 seconds
      // Backend has already invalidated all tokens
      setTimeout(() => {
        // Redirect to home page with login modal open
        window.location.href = '/?login=true&message=password-changed'
      }, 2000)
    } catch (error: unknown) {
      logger.error('Change password error:', error)
      setError(getErrorMessage(error, 'Failed to change password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
    onHide()
  }

  return (
    <StyledModalExtended show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-lock me-2"></i>
          Change Password
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <StyledAlert variant="danger" className="mb-3">
            <strong>Password Change Failed</strong>
            <div>{error}</div>
          </StyledAlert>
        )}

        {success && (
          <StyledAlert variant="success" className="mb-3">
            <strong><i className="bi bi-check-circle me-2"></i>Success!</strong>
            <div>Password changed successfully! Logging you out for security... Please log in again with your new password.</div>
          </StyledAlert>
        )}

        <Form onSubmit={handleSubmit}>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            label="Current Password"
            placeholder="Enter current password"
            required
            autoComplete="current-password"
          />

          <Form.Group className="mb-3">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              label="New Password"
              placeholder="Enter new password"
              required
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={newPassword} />
          </Form.Group>

          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
          />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <SecondaryButton
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </SecondaryButton>
        <PrimaryButton
          onClick={handleSubmit}
          disabled={loading || success || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Changing Password...
            </>
          ) : success ? (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Password Changed!
            </>
          ) : (
            <>
              <i className="bi bi-shield-check me-2"></i>
              Change Password
            </>
          )}
        </PrimaryButton>
      </Modal.Footer>
    </StyledModalExtended>
  )
}

export default ChangePasswordModal
