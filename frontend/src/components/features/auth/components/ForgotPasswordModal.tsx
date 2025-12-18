import { useState, useRef, type FormEvent } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { authAPI } from '../../../../services/api'
import { colors, shadows, transitions } from '../../../../theme/colors'

const StyledModal = styled(Modal)`
  .modal-content {
    background: ${colors.backgroundAlt};
    backdrop-filter: blur(10px);
    border: 1px solid ${colors.borderLight};
    color: ${colors.text.primary};
  }

  .modal-header {
    border-bottom: 1px solid ${colors.borderLight};
  }

  .modal-footer {
    border-top: 1px solid ${colors.borderLight};
  }

  .btn-close {
    filter: invert(1);
  }
`

const StyledForm = styled(Form)`
  .form-control {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid ${colors.borderLight};
    color: ${colors.text.primary};
    padding: 0.75rem;

    &:focus {
      background: rgba(0, 0, 0, 0.6);
      border-color: ${colors.primary};
      box-shadow: ${shadows.focus};
      color: ${colors.text.primary};
    }

    &::placeholder {
      color: ${colors.text.muted};
    }
  }
`

const AuthButton = styled(Button)`
  background: gradients.primary
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem;
  transition: ${transitions.fast};
  box-shadow: ${shadows.button};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${shadows.buttonHover};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid ${colors.danger};
  color: ${colors.danger};
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid ${colors.success};
  color: ${colors.success};
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  transition: ${transitions.default};

  &:hover {
    color: ${colors.primaryDark};
  }
`

const ForgotPasswordModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const show = searchParams.get('forgotPassword') === 'true'

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('forgotPassword')
    params.delete('message')
    setSearchParams(params)
    setEmail('')
    setMessage('')
    setIsSuccess(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage('Please complete the verification challenge.')
      setIsSuccess(false)
      return
    }

    setLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      await authAPI.forgotPassword(email, turnstileToken)
      setMessage('If that email exists, a password reset link has been sent.')
      setIsSuccess(true)
      setEmail('')
    } catch (error) {
      console.error('Forgot password request failed:', error)
      setMessage('An error occurred. Please try again.')
      setIsSuccess(false)
      // Reset turnstile on error
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToLogin = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('forgotPassword')
    params.set('login', 'true')
    setSearchParams(params)
  }

  if (!show) return null

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Forgot Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ color: colors.text.secondary, marginBottom: '1.5rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <StyledForm onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSuccess}
            />
          </Form.Group>

          <div className="mb-3 d-flex justify-content-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <AuthButton
            type="submit"
            className="w-100"
            disabled={!turnstileToken || isSuccess || loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </AuthButton>

          {message && (
            isSuccess ? (
              <SuccessMessage>{message}</SuccessMessage>
            ) : (
              <ErrorMessage>{message}</ErrorMessage>
            )
          )}
        </StyledForm>

        <div className="text-center mt-3">
          Remember your password?{' '}
          <SwitchLink type="button" onClick={handleSwitchToLogin}>
            Login here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default ForgotPasswordModal
