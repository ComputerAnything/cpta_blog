import { useState, useRef, type FormEvent } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuth } from '../../../../contexts/AuthContext'
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
      color: ${colors.text.secondary};
      transition: ${transitions.default};

      &:hover {
        color: ${colors.primary};
      }
    }

    input {
      padding-right: 50px;
    }
  }
`

const AuthButton = styled(Button)`
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
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

  &:hover {
    color: ${colors.primaryDark};
  }
`

const LoginModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const show = searchParams.get('login') === 'true'

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('login')
    params.delete('message')
    setSearchParams(params)
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage('Please complete the verification challenge.')
      return
    }

    setLoading(true)
    setShowResend(false)
    setResendStatus('')

    try {
      const response = await authAPI.login(identifier, password, turnstileToken)

      // Update auth context with user data (token is in httpOnly cookie)
      await login(response.user)

      setMessage('')
      handleClose()
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
      const errMsg = 'Login failed. Please check your credentials.'
      setMessage(errMsg)

      if (errMsg.toLowerCase().includes('verify')) {
        setShowResend(true)
      }

      // Reset turnstile on error
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendStatus('')
    setLoading(true)

    try {
      await authAPI.resendVerification(identifier)
      setResendStatus('Verification email sent! Please check your inbox.')
    } catch (error) {
      console.error('Failed to resend verification:', error)
      setResendStatus('Failed to resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToRegister = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('login')
    params.set('register', 'true')
    setSearchParams(params)
  }

  const handleSwitchToForgotPassword = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('login')
    params.set('forgotPassword', 'true')
    setSearchParams(params)
  }

  if (!show) return null

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

          <AuthButton
            type="submit"
            className="w-100 mb-2"
            disabled={!turnstileToken || loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </AuthButton>

          <div className="text-center">
            <SwitchLink type="button" onClick={handleSwitchToForgotPassword}>
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
                    type="button"
                    onClick={handleResendVerification}
                    disabled={!identifier || loading}
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
          <SwitchLink type="button" onClick={handleSwitchToRegister}>
            Register here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default LoginModal
