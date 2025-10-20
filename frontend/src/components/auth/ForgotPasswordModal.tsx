import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { Turnstile } from '@marsidev/react-turnstile'
import { useAppDispatch } from '../../redux/hooks'
import { setLoading, closeModal, openModal } from '../../redux/slices/authSlice'
import API from '../../services/api'

const StyledModal = styled(Modal)`
  .modal-content {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-close {
    filter: invert(1);
  }
`

const StyledForm = styled(Form)`
  .form-control {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.75rem;

    &:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: #00ff41;
      box-shadow: 0 0 0 0.2rem rgba(0, 255, 65, 0.25);
      color: white;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
`

const AuthButton = styled(Button)`
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #00cc33 0%, #00aa2b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.5);
  }
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.5);
  color: #00ff41;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: #00ff41;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;

  &:hover {
    color: #00cc33;
  }
`

const ForgotPasswordModal: React.FC = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const dispatch = useAppDispatch()

  const handleClose = () => {
    dispatch(closeModal())
    setEmail('')
    setMessage('')
    setIsSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage('Please complete the verification challenge.')
      setIsSuccess(false)
      return
    }

    dispatch(setLoading(true))
    setMessage('')
    setIsSuccess(false)

    try {
      const response = await API.post('/forgot-password', {
        email,
        turnstile_token: turnstileToken
      })
      setMessage(response.data.msg || 'If that email exists, a password reset link has been sent.')
      setIsSuccess(true)
      setEmail('')
    } catch (error: any) {
      setMessage(error.response?.data?.msg || 'An error occurred. Please try again.')
      setIsSuccess(false)
      // Reset turnstile on error
      setTurnstileToken(null)
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Forgot Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
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
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              theme="dark"
            />
          </div>

          <AuthButton type="submit" className="w-100" disabled={!turnstileToken || isSuccess}>
            Send Reset Link
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
          <SwitchLink onClick={() => dispatch(openModal('login'))}>
            Login here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default ForgotPasswordModal
