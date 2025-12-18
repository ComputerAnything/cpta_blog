import { useState, useRef, type FormEvent } from 'react'
import { Form, Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { authAPI } from '../../../../services/api'
import { colors, transitions } from '../../../../theme/colors'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton } from '../../../common/StyledButton'
import StyledAlert from '../../../common/StyledAlert'

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

          <PrimaryButton
            type="submit"
            className="w-100"
            disabled={!turnstileToken || isSuccess || loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </PrimaryButton>

          {message && (
            <StyledAlert
              variant={isSuccess ? 'success' : 'danger'}
              style={{ marginTop: '1rem' }}
            >
              {message}
            </StyledAlert>
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
