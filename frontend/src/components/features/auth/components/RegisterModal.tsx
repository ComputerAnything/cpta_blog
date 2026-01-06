import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Form, Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useAuth } from '../../../../contexts/AuthContext'
import { authAPI } from '../../../../services/api'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import StyledAlert from '../../../common/StyledAlert'
import { useLocalStorage } from '../../../../hooks/useLocalStorage'
import logger from '../../../../utils/logger'
import { getErrorMessage, isErrorStatus } from '../../../../utils/errors'

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

const PasswordStrengthMeter = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`

const StrengthBar = styled.div<{ strength: number }>`
  height: 4px;
  background: ${props => {
    if (props.strength === 0) return 'rgba(255, 255, 255, 0.1)';
    if (props.strength === 1) return colors.danger; // Weak - red
    if (props.strength === 2) return '#ffa500'; // Fair - orange
    if (props.strength === 3) return colors.success; // Good - green
    if (props.strength === 4) return colors.success; // Strong - green
    return 'rgba(255, 255, 255, 0.1)';
  }};
  width: ${props => (props.strength / 4) * 100}%;
  transition: ${transitions.default};
  border-radius: 2px;
`

const StrengthBarContainer = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`

const StrengthText = styled.div<{ strength: number }>`
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: ${props => {
    if (props.strength === 0) return colors.text.muted;
    if (props.strength === 1) return colors.danger;
    if (props.strength === 2) return '#ffa500';
    if (props.strength === 3) return colors.success;
    if (props.strength === 4) return colors.success;
    return colors.text.muted;
  }};
`

const PasswordRequirements = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;

  li {
    color: ${colors.text.muted};
    margin-bottom: 0.25rem;

    &.met {
      color: ${colors.success};
    }

    &::before {
      content: '• ';
      margin-right: 0.25rem;
    }
  }
`

const RegisterModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Verification state (replacing "registered")
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  // Rate limiting state
  const [rateLimitedUntil, setRateLimitedUntil, removeRateLimit] = useLocalStorage<number | null>('registration_rate_limit_until', null)
  const [countdown, setCountdown] = useState<number>(0)

  const show = searchParams.get('register') === 'true'

  // Calculate password strength (matches cpta_app logic)
  const calculatePasswordStrength = (pwd: string) => {
    const requirements = {
      minLength8: pwd.length >= 8,
      minLength12: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }

    // If less than 8 chars, weak
    if (pwd.length < 8) {
      return { strength: 1, label: 'Weak', requirements, isValid: false }
    }

    // If 12+ characters, automatically strong
    if (requirements.minLength12) {
      return { strength: 4, label: 'Strong', requirements, isValid: true }
    }

    // Between 8-11 characters - check complexity
    const complexityCount = [
      requirements.uppercase,
      requirements.lowercase,
      requirements.number,
      requirements.special
    ].filter(Boolean).length

    if (complexityCount === 4) {
      return { strength: 3, label: 'Good', requirements, isValid: true }
    } else if (complexityCount >= 2) {
      return { strength: 2, label: 'Fair', requirements, isValid: false }
    } else {
      return { strength: 1, label: 'Weak', requirements, isValid: false }
    }
  }

  const { strength: passwordStrength, label, requirements } = calculatePasswordStrength(password)

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!rateLimitedUntil) {
      setCountdown(0)
      return
    }

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = Math.ceil((rateLimitedUntil - now) / 1000)

      if (remaining <= 0) {
        setCountdown(0)
        removeRateLimit()
        setMessage(null)
      } else {
        setCountdown(remaining)
        if (!message) {
          setMessage({
            text: `Too many attempts. Please try again in ${remaining} seconds.`,
            type: 'error'
          })
        }
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [rateLimitedUntil, message, removeRateLimit])

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('register')
    params.delete('message')
    setSearchParams(params)

    // Reset form fields (matches LoginModal pattern)
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setMessage(null)
    setHoneypot('')
    setTurnstileToken(null)
    turnstileRef.current?.reset()

    // Reset verification state
    setRequiresVerification(false)
    setVerificationEmail('')
    setVerificationCode('')
    // Note: DO NOT reset rateLimitedUntil or countdown - rate limit persists across modal close/open
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage({ text: 'Please complete the verification challenge.', type: 'error' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }

    if (honeypot) {
      // Honeypot field filled, likely a bot
      return
    }

    setLoading(true)

    try {
      await authAPI.register(username, email, password, turnstileToken)

      // Transition to verification step
      setRequiresVerification(true)
      setVerificationEmail(email)
      setPassword('')  // SECURITY: Clear password from memory
      setConfirmPassword('')
      setMessage(null)
      setLoading(false)
      setTurnstileToken(null)
      turnstileRef.current?.reset()
      return  // Stay in modal, show verification input
    } catch (error: unknown) {
      logger.error('Registration failed:', error)

      // Special handling for rate limiting with Retry-After header
      if (isErrorStatus(error, 429)) {
        const axiosError = error as { response?: { headers?: { 'retry-after'?: string } } }
        const retryAfter = axiosError.response?.headers?.['retry-after']
        const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60
        const limitUntil = Date.now() + waitSeconds * 1000
        setRateLimitedUntil(limitUntil)
        setMessage({
          text: `Too many registration attempts. Please try again in ${waitSeconds} seconds.`,
          type: 'error'
        })
      } else {
        setMessage({
          text: getErrorMessage(error, 'Registration failed. Please try again.'),
          type: 'error'
        })
      }

      // Reset turnstile on error
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      // Unified verification endpoint handles both registration and 2FA
      const response = await authAPI.verify2FA(verificationEmail, verificationCode)

      // Success - complete registration and log user in with session expiry
      await login(response.user, response.sessionExpiresAt)

      // Close modal and reset all state
      handleClose()
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setVerificationCode('')
      setRequiresVerification(false)
      setVerificationEmail('')
      setMessage(null)
      navigate('/profile')
    } catch (error: unknown) {
      logger.error('Verification error:', error)

      // Clear code on error (force re-entry)
      setVerificationCode('')

      // Special handling for rate limiting
      if (isErrorStatus(error, 429)) {
        const axiosError = error as { response?: { headers?: { 'retry-after'?: string } } }
        const retryAfter = axiosError.response?.headers?.['retry-after']
        const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 300  // 5 minutes default
        const limitUntil = Date.now() + waitSeconds * 1000
        setRateLimitedUntil(limitUntil)
        setMessage({
          text: `Too many verification attempts. Please try again in ${waitSeconds} seconds.`,
          type: 'error'
        })
      } else {
        setMessage({
          text: getErrorMessage(error, 'Invalid or expired verification code. Please try again.'),
          type: 'error'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToLogin = () => {
    // Reset all state before switching (except rate limiting which persists)
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setMessage(null)
    setHoneypot('')
    setTurnstileToken(null)
    turnstileRef.current?.reset()
    setRequiresVerification(false)
    setVerificationEmail('')
    setVerificationCode('')

    // Switch to login modal
    const params = new URLSearchParams(searchParams)
    params.delete('register')
    params.set('login', 'true')
    setSearchParams(params)
  }

  if (!show) return null

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{requiresVerification ? 'Verify Your Email' : 'Register'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Error alert at the top - matches LoginModal gold standard */}
        {!requiresVerification && message && (
          <StyledAlert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-3">
            <strong>{countdown > 0 ? 'Rate Limited' : 'Registration Failed'}</strong>
            {countdown > 0
              ? ` Too many registration attempts. Please try again in ${countdown} seconds.`
              : ` ${message.text}`
            }
          </StyledAlert>
        )}

        {!requiresVerification ? (
        // Regular registration form
        <StyledForm onSubmit={handleRegister}>
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            autoComplete="off"
            tabIndex={-1}
          />

          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username (lowercase, 3-20 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={20}
              required
            />
            <Form.Text style={{ fontSize: '0.75rem', color: username.length < 3 ? colors.danger : colors.text.muted }}>
              {username.length}/20 • Lowercase letters, numbers, and underscores only
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {password && (
              <PasswordStrengthMeter>
                <StrengthBarContainer>
                  <StrengthBar strength={passwordStrength} />
                </StrengthBarContainer>
                <StrengthText strength={passwordStrength}>
                  Password Strength: {label}
                </StrengthText>
                {passwordStrength < 3 && (
                  <PasswordRequirements>
                    <li className={requirements.minLength12 ? 'met' : ''}>
                      12+ characters (recommended)
                    </li>
                    {!requirements.minLength12 && (
                      <>
                        <li className={requirements.minLength8 ? 'met' : ''}>At least 8 characters</li>
                        <li className={requirements.uppercase ? 'met' : ''}>One uppercase letter</li>
                        <li className={requirements.lowercase ? 'met' : ''}>One lowercase letter</li>
                        <li className={requirements.number ? 'met' : ''}>One number</li>
                        <li className={requirements.special ? 'met' : ''}>One special character (!@#$%^&*)</li>
                      </>
                    )}
                  </PasswordRequirements>
                )}
              </PasswordStrengthMeter>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={!turnstileToken || loading || countdown > 0}
          >
            {loading ? (
              'Registering...'
            ) : countdown > 0 ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i>
                Try again in {countdown}s
              </>
            ) : (
              'Register'
            )}
          </PrimaryButton>
        </StyledForm>
        ) : (
          // Email verification form (matches LoginModal unverified user flow)
          <StyledForm onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(23, 162, 184, 0.1)', border: '1px solid #17a2b8', borderRadius: '8px' }}>
              <strong>
                <i className="bi bi-envelope-check" style={{ marginRight: '0.5rem' }}></i>
                Email Verification Required
              </strong>
              <div style={{ marginTop: '0.5rem' }}>
                A 6-digit verification code has been sent to complete your registration. Code sent to <strong>{verificationEmail}</strong>
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#ccc' }}>
                The code expires in 10 minutes.
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#aaa', borderTop: '1px solid rgba(23, 162, 184, 0.2)', paddingTop: '0.75rem' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '0.4rem' }}></i>
                After registering, you can toggle 2FA on/off from your profile page.
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Verification Code</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
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
              <Form.Text style={{ color: '#a8a8a8ff' }}>Enter the 6-digit code from your email</Form.Text>
            </Form.Group>

            {message && (
              <StyledAlert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-3">
                {message.text}
              </StyledAlert>
            )}

            <div className="d-grid gap-2">
              <PrimaryButton
                type="submit"
                disabled={loading || countdown > 0 || verificationCode.length !== 6}
              >
                {loading ? (
                  'Verifying...'
                ) : countdown > 0 ? (
                  <>
                    <i className="bi bi-hourglass-split me-2"></i>
                    Try again in {countdown}s
                  </>
                ) : (
                  'Verify & Complete Registration'
                )}
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

        {!requiresVerification && (
          <div className="text-center mt-3">
            Already have an account?{' '}
            <SwitchLink type="button" onClick={handleSwitchToLogin}>
              Login here
            </SwitchLink>
          </div>
        )}
      </Modal.Body>
    </StyledModal>
  )
}

export default RegisterModal
