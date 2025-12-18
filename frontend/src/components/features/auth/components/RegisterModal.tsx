import { useState, useRef, type FormEvent } from 'react'
import { Form, Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { authAPI } from '../../../../services/api'
import { colors, shadows, transitions } from '../../../../theme/colors'
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

const SuccessView = styled.div`
  text-align: center;
  padding: 2rem;

  h4 {
    color: ${colors.primary};
    margin-bottom: 1.5rem;
  }

  p {
    color: ${colors.text.secondary};
    margin-bottom: 2rem;
  }
`

const RegisterModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

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

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('register')
    params.delete('message')
    setSearchParams(params)
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
      setRegistered(true)
      setMessage({
        text: 'Registration successful! Please check your email to verify your account.',
        type: 'success'
      })
    } catch (error) {
      console.error('Registration failed:', error)
      setMessage({
        text: 'Registration failed. Please try again.',
        type: 'error'
      })
      // Reset turnstile on error
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('register')
    params.set('login', 'true')
    setSearchParams(params)
  }

  const handleSwitchToLogin = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('register')
    params.set('login', 'true')
    setSearchParams(params)
  }

  if (!show) return null

  if (registered) {
    return (
      <StyledModal show onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registration Complete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuccessView>
            <h4>Success!</h4>
            <p>{message?.text}</p>
            <PrimaryButton onClick={handleGoToLogin} className="w-100">
              Go to Login
            </PrimaryButton>
          </SuccessView>
        </Modal.Body>
      </StyledModal>
    )
  }

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Register</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            disabled={!turnstileToken || loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </PrimaryButton>

          {message && (
            <StyledAlert
              variant={message.type === 'success' ? 'success' : 'danger'}
              style={{ marginTop: '1rem' }}
            >
              {message.text}
            </StyledAlert>
          )}
        </StyledForm>

        <div className="text-center mt-3">
          Already have an account?{' '}
          <SwitchLink type="button" onClick={handleSwitchToLogin}>
            Login here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default RegisterModal
