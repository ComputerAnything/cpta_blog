import React, { useState, useRef } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAppDispatch } from '../../redux/hooks'
import { setCredentials, setGuest, setLoading, closeModal, openModal } from '../../redux/slices/authSlice'
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

  .input-group {
    position: relative;

    .toggle-password-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 10;
      padding: 0.25rem 0.5rem;
    }

    input {
      padding-right: 50px;
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

const GuestButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
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

const LoginModal: React.FC = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleClose = () => dispatch(closeModal())

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage('Please complete the verification challenge.')
      return
    }

    dispatch(setLoading(true))
    setShowResend(false)
    setResendStatus('')
    try {
      const response = await API.post('/login', {
        identifier,
        password,
        turnstile_token: turnstileToken
      })
      dispatch(setCredentials({
        user: {
          id: response.data.user_id,
          username: response.data.username,
        },
        token: response.data.access_token,
      }))
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('username', response.data.username)
      localStorage.setItem('userId', response.data.user_id.toString())
      localStorage.removeItem('guest')
      setMessage('')
      handleClose()
      navigate('/posts')
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || 'Login failed. Please check your credentials.'
      setMessage(errMsg)
      if (errMsg.toLowerCase().includes('verify')) {
        setShowResend(true)
      }
      // Reset turnstile on error
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGuest = () => {
    dispatch(setGuest())
    localStorage.setItem('guest', 'true')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    setMessage('')
    handleClose()
    navigate('/posts')
  }

  const handleResendVerification = async () => {
    setResendStatus('')
    dispatch(setLoading(true))
    try {
      await API.post('/resend-verification', { identifier })
      setResendStatus('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setResendStatus(error.response?.data?.msg || 'Failed to resend verification email.')
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <StyledForm onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
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

          <AuthButton type="submit" className="w-100 mb-2" disabled={!turnstileToken}>
            Login
          </AuthButton>

          <GuestButton type="button" className="w-100 mb-2" onClick={handleGuest}>
            Continue as Guest
          </GuestButton>

          <div className="text-center">
            <SwitchLink onClick={() => dispatch(openModal('forgotPassword'))}>
              Forgot Password?
            </SwitchLink>
          </div>

          {message && (
            <ErrorMessage>
              {message}
              {showResend && (
                <>
                  <br /><br />
                  <AuthButton
                    onClick={handleResendVerification}
                    disabled={!identifier}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)' }}
                  >
                    Resend Verification Email
                  </AuthButton>
                </>
              )}
            </ErrorMessage>
          )}

          {showResend && resendStatus && (
            resendStatus.includes('sent') ? (
              <SuccessMessage>{resendStatus}</SuccessMessage>
            ) : (
              <ErrorMessage>{resendStatus}</ErrorMessage>
            )
          )}
        </StyledForm>

        <div className="text-center mt-3">
          Don't have an account?{' '}
          <SwitchLink onClick={() => dispatch(openModal('register'))}>
            Register here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default LoginModal
