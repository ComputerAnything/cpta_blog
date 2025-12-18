import { useState, useRef, type FormEvent } from 'react'
import { Form, Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuth } from '../../../../contexts/AuthContext'
import { authAPI } from '../../../../services/api'
import { colors, transitions, shadows } from '../../../../theme/colors'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
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

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFAEmail, setTwoFAEmail] = useState('')
  const [twoFACode, setTwoFACode] = useState('')

  const show = searchParams.get('login') === 'true'

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('login')
    params.delete('message')
    setSearchParams(params)

    // Reset 2FA state
    setRequires2FA(false)
    setTwoFAEmail('')
    setTwoFACode('')
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

      // Check if 2FA is required
      if (response.requires_2fa) {
        setRequires2FA(true)
        setTwoFAEmail(response.email || identifier)
        setPassword('')  // SECURITY: Clear password from memory
        setMessage('')
        setLoading(false)
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        return  // Stay in modal, show 2FA input
      }

      // Normal login flow (non-2FA)
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

  const handleVerify2FA = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await authAPI.verify2FA(twoFAEmail, twoFACode)

      // Success - complete login
      await login(response.user)

      // Close modal and reset all state
      handleClose()
      setIdentifier('')
      setPassword('')
      setTwoFACode('')
      setRequires2FA(false)
      setTwoFAEmail('')
      setMessage('')
      navigate('/')
    } catch (error) {
      console.error('2FA verification error:', error)
      setTwoFACode('')  // Clear code on error
      setMessage('Invalid or expired verification code. Please try again.')
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
        {!requires2FA ? (
          // Regular login form
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

            <PrimaryButton
              type="submit"
              className="w-100 mb-2"
              disabled={!turnstileToken || loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </PrimaryButton>

            <div className="text-center">
              <SwitchLink type="button" onClick={handleSwitchToForgotPassword}>
                Forgot Password?
              </SwitchLink>
            </div>

            {message && (
              <StyledAlert variant="danger">
                {message}
                {showResend && (
                  <>
                    <br /><br />
                    <PrimaryButton
                      type="button"
                      onClick={handleResendVerification}
                      disabled={!identifier || loading}
                      style={{ width: '100%' }}
                    >
                      Resend Verification Email
                    </PrimaryButton>
                  </>
                )}
              </StyledAlert>
            )}

            {showResend && resendStatus && (
              resendStatus.includes('sent') ? (
                <StyledAlert variant="success">{resendStatus}</StyledAlert>
              ) : (
                <StyledAlert variant="danger">{resendStatus}</StyledAlert>
              )
            )}
          </StyledForm>
        ) : (
          // 2FA verification form
          <StyledForm onSubmit={handleVerify2FA}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', border: '1px solid #17a2b8', borderRadius: '8px' }}>
              <strong><i className="bi bi-envelope-check" style={{ marginRight: '0.5rem' }}></i>Verification Required</strong>
              <div style={{ marginTop: '0.5rem' }}>
                A 6-digit verification code has been sent to <strong>{twoFAEmail}</strong>
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#ccc' }}>
                The code expires in 5 minutes.
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Verification Code</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoFocus
                style={{
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  fontFamily: 'monospace'
                }}
              />
              <Form.Text>Enter the 6-digit code from your email</Form.Text>
            </Form.Group>

            {message && <StyledAlert variant="danger">{message}</StyledAlert>}

            <div className="d-grid gap-2">
              <PrimaryButton
                type="submit"
                disabled={loading || twoFACode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </PrimaryButton>
              <SecondaryButton
                onClick={handleClose}
                disabled={loading}
              >
                Cancel & Start Over
              </SecondaryButton>
            </div>
          </StyledForm>
        )}

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
